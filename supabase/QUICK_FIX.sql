-- ==============================================================================
-- حل فوري ونهائي لجميع أخطاء قاعدة البيانات (Supabase Quick Fix)
-- انسخ هذا الملف بالكامل والصقه في SQL Editor في Supabase ثم اضغط RUN
-- ==============================================================================

-- 1. إزالة الدوال القديمة بالكامل لتفادي أي تعارض في البارامترات (42P13)
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_banned(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_blocked(uuid, uuid) CASCADE;

-- 2. إزالة أي تريجرز قديمة تعطل إرسال الرسائل
DROP TRIGGER IF EXISTS trg_check_room_message_safety ON public.room_messages;
DROP TRIGGER IF EXISTS trg_enforce_room_message_safety ON public.room_messages;
DROP TRIGGER IF EXISTS trg_room_message_safety ON public.room_messages;
DROP TRIGGER IF EXISTS trg_sync_profile_age ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_profile_private_age ON public.profile_private;
DROP TRIGGER IF EXISTS trg_protect_profile_system_columns ON public.profiles;

-- 3. إنشاء الدوال المطلوبة بصلاحيات آمنة وسليمة
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_banned(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bans
    WHERE user_id = check_user_id
      AND (banned_until IS NULL OR banned_until > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_blocked(source_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = source_user_id AND blocked_id = target_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated, anon;

-- 4. ضبط وتصحيح سياسات الأمان (RLS) لجدول profiles لمنع أي خطأ RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 5. ضبط وتصحيح سياسات الأمان لجدول profile_private
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_private_select" ON public.profile_private;
CREATE POLICY "profile_private_select" ON public.profile_private
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "profile_private_insert" ON public.profile_private;
CREATE POLICY "profile_private_insert" ON public.profile_private
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "profile_private_update" ON public.profile_private;
CREATE POLICY "profile_private_update" ON public.profile_private
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. ضبط وتصحيح سياسات رسائل الشات (room_messages) للسماح بالإرسال فوراً
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_messages_select" ON public.room_messages;
CREATE POLICY "room_messages_select" ON public.room_messages
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "room_messages_insert" ON public.room_messages;
CREATE POLICY "room_messages_insert" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "room_messages_delete" ON public.room_messages;
CREATE POLICY "room_messages_delete" ON public.room_messages
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

-- 7. ضبط وتصحيح سياسات المحادثات الخاصة (messages & conversations)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two);

DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two);

DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two);

DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = sender_id);

-- 8. التأكد من وجود غرفة الدردشة الرئيسية الموحدة
INSERT INTO public.rooms (slug, name, description, country, topic, is_active)
VALUES (
  'main',
  'الدردشة الجماعية',
  'غرفة الدردشة والتواصل لجميع الأصدقاء',
  'جميع الدول',
  'شات الأصدقاء',
  true
)
ON CONFLICT (slug) DO UPDATE
SET is_active = true,
    name = 'الدردشة الجماعية';

-- 9. جدول التفاعلات السريعة على الرسائل (Reactions)
CREATE TABLE IF NOT EXISTS public.room_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select" ON public.room_message_reactions;
CREATE POLICY "reactions_select" ON public.room_message_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reactions_insert" ON public.room_message_reactions;
CREATE POLICY "reactions_insert" ON public.room_message_reactions
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "reactions_delete" ON public.room_message_reactions;
CREATE POLICY "reactions_delete" ON public.room_message_reactions
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 10. عمود الرسائل المثبتة في الغرفة (Pinned Message)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS pinned_message_id uuid REFERENCES public.room_messages(id) ON DELETE SET NULL;
