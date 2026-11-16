-- ==============================================================================
-- 0001_init.sql: Initial Schema for Sohba (صحبة)
-- Description: Sets up core tables, privacy separation, under-18 checks,
--              anti-spam rules, RLS policies, indexes, and seed rooms.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLES & SUPPORTING TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Public Profiles (visible to other users who are not blocked)
-- Note: Email and birth_date are strictly excluded from this table for privacy.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(trim(nickname)) >= 2 AND char_length(nickname) <= 30),
  avatar_url text,
  bio text CHECK (bio IS NULL OR char_length(bio) <= 500),
  gender text CHECK (gender IS NULL OR gender IN ('male', 'female')),
  intent text NOT NULL DEFAULT 'both' CHECK (intent IN ('friendship', 'serious', 'both')),
  country text NOT NULL,
  city text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 120),
  interests text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 Profile Private (Strictly private data: only owner and admins can access)
CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  birth_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 User Roles (Protected: stores admin and moderator privileges)
-- Standard users cannot insert, update, or elevate their own role.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.4 Bans (Protected: managed only by admins)
CREATE TABLE IF NOT EXISTS public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  banned_until timestamptz, -- NULL means permanent ban
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.5 Blocks (User blocking user: mutually hides profiles and blocks messages)
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_not_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

-- 2.6 Public Chat Rooms
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

-- 2.7 Public Room Messages
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.8 Direct Conversations (1-to-1 chat sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_ordered_participants CHECK (participant_one < participant_two),
  CONSTRAINT conversations_unique_participants UNIQUE (participant_one, participant_two)
);

-- 2.9 Direct Messages (1-to-1 chat messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.10 Chat Requests (Before starting a direct conversation)
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_message text NOT NULL CHECK (char_length(trim(initial_message)) > 0 AND char_length(initial_message) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_requests_not_self CHECK (sender_id <> receiver_id),
  CONSTRAINT chat_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

-- 2.11 Reports (Submitted by users, reviewed only by admins)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('user', 'message', 'room')),
  target_id text NOT NULL,
  reason text NOT NULL CHECK (char_length(trim(reason)) > 0),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------------------------

-- Foreign keys and lookup indexes
CREATE INDEX IF NOT EXISTS idx_profiles_country_city ON public.profiles(country, city);
CREATE INDEX IF NOT EXISTS idx_profiles_intent ON public.profiles(intent);
CREATE INDEX IF NOT EXISTS idx_profile_private_user_id ON public.profile_private(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON public.bans(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_rooms_slug ON public.rooms(slug);
CREATE INDEX IF NOT EXISTS idx_rooms_country_topic ON public.rooms(country, topic);

-- Message chronology indexes
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON public.room_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_one, participant_two);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- 4.1 Admin Check Helper (SECURITY DEFINER with strict search_path)
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

-- 4.2 Ban Check Helper
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

-- 4.3 Mutual Block Check Helper
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

-- 4.4 Under-18 Database Protection & Age Calculation Trigger
CREATE OR REPLACE FUNCTION public.handle_profile_private_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated_age integer;
BEGIN
  -- Strict Under-18 rejection at the database level
  IF NEW.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'التسجيل متاح فقط للبالغين بعمر 18 سنة فما فوق.' USING ERRCODE = '23514';
  END IF;

  IF NEW.birth_date < (CURRENT_DATE - INTERVAL '120 years') THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END IF;

  -- Calculate age in full completed years
  calculated_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;

  -- Synchronize age into the public profiles table
  UPDATE public.profiles
  SET age = calculated_age,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_birth_date ON public.profile_private;
CREATE TRIGGER trg_validate_birth_date
  BEFORE INSERT OR UPDATE OF birth_date ON public.profile_private
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_private_validation();

-- 4.5 Anti-Spam Trigger on Public Room Messages (Enforces rule: new accounts cannot post links or phone numbers)
CREATE OR REPLACE FUNCTION public.enforce_room_message_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_created_at timestamptz;
BEGIN
  -- Check user ban status first
  IF public.is_banned(NEW.user_id) THEN
    RAISE EXCEPTION 'هذا الحساب محظور من المشاركة.' USING ERRCODE = '42501';
  END IF;

  SELECT created_at INTO profile_created_at
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If the account is less than 24 hours old, block links and phone numbers
  IF profile_created_at IS NOT NULL AND (now() - profile_created_at) < INTERVAL '24 hours' THEN
    -- Regex matches URLs (http, https, www, t.me, wa.me) or phone number sequences (8 or more digits)
    IF NEW.content ~* '(https?://|www\.[a-z0-9]|t\.me/|wa\.me/|\+?[0-9]{8,15})' THEN
      RAISE EXCEPTION 'لحماية المجتمع، لا يمكن للحسابات الجديدة إرسال روابط أو أرقام هواتف في الغرف العامة خلال أول 24 ساعة.' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_room_message_safety ON public.room_messages;
CREATE TRIGGER trg_check_room_message_safety
  BEFORE INSERT ON public.room_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_room_message_safety();

-- 4.6 Updated_at Timestamp Trigger Helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profile_private_updated_at ON public.profile_private;
CREATE TRIGGER trg_profile_private_updated_at
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4.7 Automatic Profile Creation Trigger on Sign-up
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
  v_country := coalesce(NEW.raw_user_meta_data->>'country', 'مصر');
  v_city := coalesce(NEW.raw_user_meta_data->>'city', 'القاهرة');
  v_gender := NEW.raw_user_meta_data->>'gender';
  v_intent := coalesce(NEW.raw_user_meta_data->>'intent', 'both');

  IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN
    v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
  ELSE
    v_birth_date := CURRENT_DATE - INTERVAL '18 years';
  END IF;

  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

  -- Insert into public.profiles
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

  -- Insert into public.profile_private
  INSERT INTO public.profile_private (user_id, email, birth_date)
  VALUES (NEW.id, NEW.email, v_birth_date)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        birth_date = EXCLUDED.birth_date;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4.8 Self Account Deletion Helper (Allows user to delete their account and cascade all data)
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
-- 5. ROW LEVEL SECURITY (RLS) ACTIVATION
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

-- ------------------------------------------------------------------------------
-- 6. RLS POLICIES (Explicit deny by default, subquery cached auth.uid())
-- ------------------------------------------------------------------------------

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    NOT public.is_blocked((SELECT auth.uid()), id)
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = id
    AND NOT public.is_banned((SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR public.is_admin((SELECT auth.uid()))
  );

-- 6.2 PROFILE_PRIVATE POLICIES
DROP POLICY IF EXISTS "profile_private_select" ON public.profile_private;
CREATE POLICY "profile_private_select" ON public.profile_private
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "profile_private_insert" ON public.profile_private;
CREATE POLICY "profile_private_insert" ON public.profile_private
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "profile_private_update" ON public.profile_private;
CREATE POLICY "profile_private_update" ON public.profile_private
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND NOT public.is_banned((SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "profile_private_delete" ON public.profile_private;
CREATE POLICY "profile_private_delete" ON public.profile_private
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin((SELECT auth.uid()))
  );

-- 6.3 USER_ROLES POLICIES
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- 6.4 BANS POLICIES
DROP POLICY IF EXISTS "bans_admin_select" ON public.bans;
CREATE POLICY "bans_admin_select" ON public.bans
  FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "bans_admin_insert" ON public.bans;
CREATE POLICY "bans_admin_insert" ON public.bans
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "bans_admin_update" ON public.bans;
CREATE POLICY "bans_admin_update" ON public.bans
  FOR UPDATE TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "bans_admin_delete" ON public.bans;
CREATE POLICY "bans_admin_delete" ON public.bans
  FOR DELETE TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- 6.5 BLOCKS POLICIES
DROP POLICY IF EXISTS "blocks_select" ON public.blocks;
CREATE POLICY "blocks_select" ON public.blocks
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "blocks_insert" ON public.blocks;
CREATE POLICY "blocks_insert" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = blocker_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "blocks_delete" ON public.blocks;
CREATE POLICY "blocks_delete" ON public.blocks
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = blocker_id);

-- 6.6 ROOMS POLICIES
DROP POLICY IF EXISTS "rooms_select" ON public.rooms;
CREATE POLICY "rooms_select" ON public.rooms
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "rooms_admin_all" ON public.rooms;
CREATE POLICY "rooms_admin_all" ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- 6.7 ROOM_MESSAGES POLICIES
DROP POLICY IF EXISTS "room_messages_select" ON public.room_messages;
CREATE POLICY "room_messages_select" ON public.room_messages
  FOR SELECT TO authenticated
  USING (
    NOT public.is_blocked((SELECT auth.uid()), user_id)
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

-- 6.8 CONVERSATIONS POLICIES
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
    AND NOT public.is_blocked(participant_one, participant_two)
    AND NOT public.is_banned((SELECT auth.uid()))
  );

-- 6.9 MESSAGES POLICIES
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
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
      WHERE c.id = messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
        AND NOT public.is_blocked(c.participant_one, c.participant_two)
    )
  );

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) <> sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) <> sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND ((SELECT auth.uid()) = c.participant_one OR (SELECT auth.uid()) = c.participant_two)
    )
  );

-- 6.10 CHAT_REQUESTS POLICIES
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
  USING (
    (SELECT auth.uid()) = receiver_id
    AND NOT public.is_banned((SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = receiver_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

-- 6.11 REPORTS POLICIES
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = reporter_id
    AND NOT public.is_banned((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "reports_admin_select" ON public.reports;
CREATE POLICY "reports_admin_select" ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_admin_update" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- ------------------------------------------------------------------------------
-- 7. REALTIME PUBLICATION CONFIGURATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE
    public.room_messages,
    public.messages,
    public.conversations,
    public.chat_requests;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN undefined_object THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 8. SEED DATA (8 Public Rooms by Country and Topic)
-- ------------------------------------------------------------------------------
INSERT INTO public.rooms (slug, name, description, country, topic, is_active)
VALUES
  (
    'egypt-chat',
    'غرفة مصر',
    'مصر - ملتقى الأحباب للتعارف والدردشة وسوالف أهل الكرم',
    'مصر',
    'تعارف وصداقة',
    true
  ),
  (
    'saudi-chat',
    'غرفة السعودية',
    'السعودية - سوالف ولمة للأهل والأصدقاء في المملكة',
    'السعودية',
    'تعارف وصداقة',
    true
  ),
  (
    'maghreb-chat',
    'غرفة المغرب العربي',
    'المغرب العربي - فضاء للتواصل والأخوة بين الأشقاء (المغرب، الجزائر، تونس)',
    'المغرب العربي',
    'تعارف وصداقة',
    true
  ),
  (
    'levant-chat',
    'غرفة بلاد الشام',
    'بلاد الشام - حوار ومحبة يجمع أهل الشام الكرام',
    'بلاد الشام',
    'تعارف وصداقة',
    true
  ),
  (
    'gulf-chat',
    'غرفة الخليج العربي',
    'مجلس الخليج - تعارف ودردشة تجمع أبناء الخليج العربي',
    'الخليج العربي',
    'تعارف وصداقة',
    true
  ),
  (
    'serious-marriage',
    'زواج وتعارف جاد',
    'مساحة مخصصة للتعارف الهادف والجاد برقي واحترام',
    'جميع الدول',
    'زواج وتعارف جاد',
    true
  ),
  (
    'sohba-cafe',
    'مقهى صحبة',
    'الملتقى العام للنقاشات وتبادل الآراء واليوميات والاهتمامات',
    'جميع الدول',
    'نقاش عام',
    true
  ),
  (
    'culture-arts',
    'ثقافة وفنون',
    'حوارات ومساحات فكرية وأدبية وفنية حول الإبداع والثقافة',
    'جميع الدول',
    'ثقافة وفنون',
    true
  )
ON CONFLICT (slug) DO NOTHING;
