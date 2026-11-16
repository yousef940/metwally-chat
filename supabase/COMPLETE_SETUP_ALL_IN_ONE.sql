-- ==============================================================================
-- COMPLETE_SETUP_ALL_IN_ONE.sql
-- منصة عيلة الحاج متولي - الإعداد الشامل المتكامل لقاعدة البيانات ومخزن الصور
-- 
-- ميزات هذا الملف:
-- 1. آمن تماماً وقابل للتشغيل عدة مرات (Idempotent) دون أي أخطاء (ERROR: 42710 أو 42P13)
-- 2. ينشئ جميع الجداول والدوال ومتحكمات الأمان (RLS)
-- 3. يضبط مخزن الصور الشخصية (Avatars Storage Bucket) وسياسات الرفع
-- 4. يفعل غرفة الدردشة الجماعية الموحدة (main)
-- 5. يدعم تسجيل الدخول بالاسم المستعار وكلمة المرور وحساب العمر تلقائياً من سنة الميلاد
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. الإضافات (EXTENSIONS)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. الجداول الأساسية (TABLES)
-- ------------------------------------------------------------------------------

-- 2.1 الملفات الشخصية العامة
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(trim(nickname)) >= 2 AND char_length(nickname) <= 30),
  avatar_url text,
  bio text CHECK (bio IS NULL OR char_length(bio) <= 500),
  gender text CHECK (gender IS NULL OR gender IN ('male', 'female')),
  intent text NOT NULL DEFAULT 'both' CHECK (intent IN ('friendship', 'serious', 'both')),
  country text NOT NULL DEFAULT 'مصر',
  city text NOT NULL DEFAULT 'القاهرة',
  age integer NOT NULL DEFAULT 20 CHECK (age >= 1 AND age <= 120),
  interests text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- التأكد من وجود الأعمدة وتعديل قيد العمر ليكون مرناً للجميع
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IS NULL OR gender IN ('male', 'female'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_check CHECK (age >= 1 AND age <= 120);

-- 2.2 البيانات الخاصة الحساسة
CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  birth_date date NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '20 years'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 الرتب والصلاحيات
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.4 الحظر الإداري
CREATE TABLE IF NOT EXISTS public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  banned_until timestamptz,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.5 الحظر المتبادل بين الأعضاء
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_not_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

-- 2.6 الغرف
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  country text,
  topic text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.7 رسائل الغرف
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.8 المحادثات الخاصة
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_ordered_participants CHECK (participant_one < participant_two),
  CONSTRAINT conversations_unique_participants UNIQUE (participant_one, participant_two)
);

-- 2.9 رسائل المحادثات الخاصة
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.10 طلبات المحادثة
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text CHECK (message IS NULL OR (char_length(trim(message)) > 0 AND char_length(message) <= 500)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_requests_not_self CHECK (sender_id <> receiver_id),
  CONSTRAINT chat_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

-- 2.11 كتم الإشعارات
CREATE TABLE IF NOT EXISTS public.conversation_mutes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

-- 2.12 البلاغات
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('profile', 'message', 'room_message')),
  target_id text NOT NULL,
  reason text NOT NULL CHECK (char_length(trim(reason)) > 0 AND char_length(reason) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_not_self CHECK (reporter_id <> reported_user_id)
);

-- ------------------------------------------------------------------------------
-- 3. الفهارس (INDEXES)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_intent ON public.profiles(intent);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON public.bans(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_rooms_slug ON public.rooms(slug);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON public.room_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_one, participant_two);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_conversation_mutes_user ON public.conversation_mutes(user_id, conversation_id);

-- ------------------------------------------------------------------------------
-- 4. الدوال المساعدة والأمان (FUNCTIONS)
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
$$;

DROP FUNCTION IF EXISTS public.is_banned(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_banned(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bans
    WHERE user_id = check_user_id
      AND (banned_until IS NULL OR banned_until > now())
  );
$$;

DROP FUNCTION IF EXISTS public.is_blocked(uuid, uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

-- التحقق من صحة تاريخ الميلاد وحساب العمر
DROP FUNCTION IF EXISTS public.handle_profile_private_validation() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_profile_private_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated_age integer;
BEGIN
  IF NEW.birth_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END IF;

  IF NEW.birth_date < (CURRENT_DATE - INTERVAL '120 years') THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END IF;

  calculated_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;

  UPDATE public.profiles
  SET age = calculated_age,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- دالة إنشاء الملف الشخصي التلقائي عند التسجيل
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nickname text;
  v_country text;
  v_city text;
  v_birth_date date;
  v_gender text;
  v_intent text;
  v_age integer;
BEGIN
  v_nickname := coalesce(trim(NEW.raw_user_meta_data->>'nickname'), split_part(NEW.email, '@', 1));
  IF v_nickname IS NULL OR char_length(v_nickname) < 2 THEN
    v_nickname := 'مستخدم_' || substr(NEW.id::text, 1, 6);
  END IF;
  
  v_country := coalesce(NEW.raw_user_meta_data->>'country', 'مصر');
  v_city := coalesce(NEW.raw_user_meta_data->>'city', 'القاهرة');
  v_gender := NEW.raw_user_meta_data->>'gender';
  IF v_gender NOT IN ('male', 'female') THEN
    v_gender := NULL;
  END IF;
  v_intent := coalesce(NEW.raw_user_meta_data->>'intent', 'both');

  IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN
    BEGIN
      v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := CURRENT_DATE - INTERVAL '20 years';
    END;
  ELSE
    v_birth_date := CURRENT_DATE - INTERVAL '20 years';
  END IF;

  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;
  IF v_age < 1 THEN v_age := 1; END IF;

  -- إنشاء أو تحديث الملف العام
  INSERT INTO public.profiles (id, nickname, country, city, age, gender, intent)
  VALUES (NEW.id, v_nickname, v_country, v_city, v_age, v_gender, v_intent)
  ON CONFLICT (id) DO UPDATE
    SET nickname = EXCLUDED.nickname,
        country = EXCLUDED.country,
        city = EXCLUDED.city,
        age = EXCLUDED.age,
        gender = coalesce(EXCLUDED.gender, public.profiles.gender),
        intent = EXCLUDED.intent,
        updated_at = now();

  -- إنشاء أو تحديث البيانات الخاصة
  INSERT INTO public.profile_private (user_id, email, birth_date)
  VALUES (NEW.id, NEW.email, v_birth_date)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        birth_date = EXCLUDED.birth_date,
        updated_at = now();

  RETURN NEW;
END;
$$;

-- دالة حذف الحساب الذاتية
DROP FUNCTION IF EXISTS public.delete_own_user() CASCADE;
CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. المشغلات (TRIGGERS)
-- ------------------------------------------------------------------------------
-- حذف أي مشغلات قديمة مسبقة قد تتعارض
DROP TRIGGER IF EXISTS trg_sync_profile_age ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_profile_private_age ON public.profile_private;
DROP TRIGGER IF EXISTS trg_protect_profile_system_columns ON public.profiles;
DROP TRIGGER IF EXISTS trg_profile_private_birth_date ON public.profile_private;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profile_private_updated_at ON public.profile_private;
CREATE TRIGGER trg_profile_private_updated_at
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_validate_birth_date ON public.profile_private;
CREATE TRIGGER trg_validate_birth_date
  BEFORE INSERT OR UPDATE OF birth_date ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_private_validation();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- 6. تفعيل حماية الصفوف (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_mutes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7. سياسات الأمان (RLS POLICIES) - مسقطة مسبقاً لمنع أي تكرار
-- ------------------------------------------------------------------------------

-- 7.1 PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (NOT public.is_blocked((SELECT auth.uid()), id));

DROP POLICY IF EXISTS "profiles_select_blocked_by_me" ON public.profiles;
CREATE POLICY "profiles_select_blocked_by_me" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE b.blocker_id = (SELECT auth.uid())
        AND b.blocked_id = public.profiles.id
    )
  );

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = public.profiles.id)
         OR (b.blocker_id = public.profiles.id AND b.blocked_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin((SELECT auth.uid())));

-- 7.2 PROFILE_PRIVATE
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

-- 7.3 USER_ROLES
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- 7.4 BANS
DROP POLICY IF EXISTS "bans_select" ON public.bans;
CREATE POLICY "bans_select" ON public.bans
  FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())) OR (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "bans_owner_select" ON public.bans;
CREATE POLICY "bans_owner_select" ON public.bans
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "bans_admin_all" ON public.bans;
CREATE POLICY "bans_admin_all" ON public.bans
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- 7.5 BLOCKS
DROP POLICY IF EXISTS "blocks_select" ON public.blocks;
CREATE POLICY "blocks_select" ON public.blocks
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "blocks_insert" ON public.blocks;
CREATE POLICY "blocks_insert" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = blocker_id AND NOT public.is_banned((SELECT auth.uid())));

DROP POLICY IF EXISTS "blocks_delete" ON public.blocks;
CREATE POLICY "blocks_delete" ON public.blocks
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

-- 7.6 ROOMS
DROP POLICY IF EXISTS "rooms_select" ON public.rooms;
CREATE POLICY "rooms_select" ON public.rooms
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms;
CREATE POLICY "rooms_admin_all" ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- 7.7 ROOM_MESSAGES
DROP POLICY IF EXISTS "room_messages_select" ON public.room_messages;
CREATE POLICY "room_messages_select" ON public.room_messages
  FOR SELECT TO authenticated
  USING (
    NOT public.is_banned((SELECT auth.uid()))
    AND NOT public.is_blocked((SELECT auth.uid()), user_id)
  );

DROP POLICY IF EXISTS "room_messages_insert" ON public.room_messages;
CREATE POLICY "room_messages_insert" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "room_messages_delete" ON public.room_messages;
CREATE POLICY "room_messages_delete" ON public.room_messages
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin((SELECT auth.uid()))
  );

-- 7.8 CONVERSATIONS
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two)
    AND NOT public.is_blocked(participant_one, participant_two)
  );

DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two)
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two))
  WITH CHECK (((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two));

-- 7.9 MESSAGES
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
        AND NOT public.is_blocked(c.participant_one, c.participant_two)
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND NOT public.is_banned((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
        AND NOT public.is_blocked(c.participant_one, c.participant_two)
    )
  );

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = public.messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
    )
  );

DROP POLICY IF EXISTS "messages_admin_delete" ON public.messages;
CREATE POLICY "messages_admin_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- 7.10 CHAT_REQUESTS
DROP POLICY IF EXISTS "chat_requests_select" ON public.chat_requests;
CREATE POLICY "chat_requests_select" ON public.chat_requests
  FOR SELECT TO authenticated
  USING (
    ((SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id)
    AND NOT public.is_blocked(sender_id, receiver_id)
  );

DROP POLICY IF EXISTS "chat_requests_insert" ON public.chat_requests;
CREATE POLICY "chat_requests_insert" ON public.chat_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND NOT public.is_banned((SELECT auth.uid()))
    AND NOT public.is_blocked(sender_id, receiver_id)
  );

DROP POLICY IF EXISTS "chat_requests_update" ON public.chat_requests;
CREATE POLICY "chat_requests_update" ON public.chat_requests
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = receiver_id OR (SELECT auth.uid()) = sender_id)
  WITH CHECK ((SELECT auth.uid()) = receiver_id OR (SELECT auth.uid()) = sender_id);

-- 7.11 CONVERSATION_MUTES
DROP POLICY IF EXISTS "conversation_mutes_all" ON public.conversation_mutes;
CREATE POLICY "conversation_mutes_all" ON public.conversation_mutes
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7.12 REPORTS
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id AND NOT public.is_banned((SELECT auth.uid())));

DROP POLICY IF EXISTS "reports_admin_select" ON public.reports;
CREATE POLICY "reports_admin_select" ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_admin_update" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "reports_admin_delete" ON public.reports;
CREATE POLICY "reports_admin_delete" ON public.reports
  FOR DELETE TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- ------------------------------------------------------------------------------
-- 8. إعداد مخزن الصور الشخصية (AVATARS STORAGE BUCKET)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- سياسات تخزين الصور
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ------------------------------------------------------------------------------
-- 9. تفعيل غرفة الدردشة الجماعية الموحدة (SINGLE ROOM)
-- ------------------------------------------------------------------------------
INSERT INTO public.rooms (slug, name, description, country, topic, is_active)
VALUES (
  'main',
  'الدردشة الجماعية',
  'غرفة الدردشة والتواصل الرئيسية لجميع الأصدقاء',
  'جميع الدول',
  'شات الأصدقاء',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  country = EXCLUDED.country,
  topic = EXCLUDED.topic,
  is_active = true;

-- إلغاء تفعيل أي غرف أخرى للحفاظ على غرفة واحدة فقط
UPDATE public.rooms
SET is_active = false
WHERE slug <> 'main';

-- ------------------------------------------------------------------------------
-- 10. تفعيل التزامن الفوري (SUPABASE REALTIME)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- في حال عدم توفر صلاحية التعديل على النشر المباشر عبر المحرر
  NULL;
END $$;
