-- ==============================================================================
-- 0004_hardening.sql: Backend & Database Hardening
-- Description: Completes Row Level Security coverage, restricts writable
--              columns, adds the missing search indexes, and hardens the
--              safety triggers (18+, anti-spam, profile age integrity).
--
-- This migration is IDEMPOTENT and never deletes existing user data.
-- Run it in the Supabase SQL Editor AFTER 0001, 0002 and 0003.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROW LEVEL SECURITY — COMPLETE THE MISSING POLICIES
--    (no existing policy is dropped or weakened)
-- ------------------------------------------------------------------------------

-- 1.1 A member must be able to read their OWN ban record.
--     Without this policy the application could never detect an active ban,
--     because only administrators were allowed to read the bans table.
DROP POLICY IF EXISTS "bans_owner_select" ON public.bans;
CREATE POLICY "bans_owner_select" ON public.bans
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 1.2 The blocker keeps read access to the basic profile of the people they
--     blocked, so the "blocked users" list stays usable.
--     The blocked user still cannot see the blocker (the mutual block rule
--     in "profiles_select" still applies to them).
DROP POLICY IF EXISTS "profiles_select_blocked_by_me" ON public.profiles;
CREATE POLICY "profiles_select_blocked_by_me" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = id
    AND EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE b.blocker_id = (SELECT auth.uid())
        AND b.blocked_id = public.profiles.id
    )
  );

-- 1.3 Administrators can delete private messages (moderation duty).
DROP POLICY IF EXISTS "messages_admin_delete" ON public.messages;
CREATE POLICY "messages_admin_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- 1.4 Participants can refresh the conversation timestamp.
--     There was no UPDATE policy at all, so "last message" ordering never
--     changed and the update silently failed.
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = participant_one OR (SELECT auth.uid()) = participant_two)
  );

-- 1.5 Administrators can delete reports (retention / moderation).
DROP POLICY IF EXISTS "reports_admin_delete" ON public.reports;
CREATE POLICY "reports_admin_delete" ON public.reports
  FOR DELETE TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- ------------------------------------------------------------------------------
-- 2. COLUMN LEVEL GRANTS — A USER MAY ONLY CHANGE WHAT THEY OWN
-- ------------------------------------------------------------------------------

-- 2.1 A participant may only flip the "is_read" flag, never rewrite the text
--     or the sender of somebody else's message.
REVOKE UPDATE ON public.messages FROM PUBLIC;
REVOKE UPDATE ON public.messages FROM anon;
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (is_read) ON public.messages TO authenticated;

-- 2.2 A receiver may only change the status of a chat request, never the
--     sender, the receiver or the initial message.
REVOKE UPDATE ON public.chat_requests FROM PUBLIC;
REVOKE UPDATE ON public.chat_requests FROM anon;
REVOKE UPDATE ON public.chat_requests FROM authenticated;
GRANT UPDATE (status, updated_at) ON public.chat_requests TO authenticated;

-- 2.3 A participant may only refresh the conversation timestamp.
REVOKE UPDATE ON public.conversations FROM PUBLIC;
REVOKE UPDATE ON public.conversations FROM anon;
REVOKE UPDATE ON public.conversations FROM authenticated;
GRANT UPDATE (updated_at) ON public.conversations TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR THE COLUMNS USED IN SEARCH AND FILTERING
-- ------------------------------------------------------------------------------

-- 3.1 Profiles (discovery: newest first, country/city, gender + intent)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_country_city_intent
  ON public.profiles(country, city, intent);
CREATE INDEX IF NOT EXISTS idx_profiles_gender_intent
  ON public.profiles(gender, intent);

-- 3.2 Public room messages (chronology per room and per author)
CREATE INDEX IF NOT EXISTS idx_room_messages_user_created
  ON public.room_messages(user_id, created_at DESC);

-- 3.3 Private messages (unread counter per conversation, history per sender)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread
  ON public.messages(conversation_id, is_read)
  WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
  ON public.messages(sender_id, created_at DESC);

-- 3.4 Conversations (inbox listing from both sides)
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two
  ON public.conversations(participant_two, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON public.conversations(updated_at DESC);

-- 3.5 Chat requests (inbox/outbox listings, both directions)
CREATE INDEX IF NOT EXISTS idx_chat_requests_status_created
  ON public.chat_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender_receiver
  ON public.chat_requests(sender_id, receiver_id);

-- 3.6 Reports (moderation queue and target lookups)
CREATE INDEX IF NOT EXISTS idx_reports_target
  ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id
  ON public.reports(reporter_id);

-- 3.7 Blocks (reverse lookups)
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_created
  ON public.blocks(blocked_id, created_at DESC);

-- 3.8 Bans (active ban lookups)
CREATE INDEX IF NOT EXISTS idx_bans_banned_until
  ON public.bans(banned_until);

-- ------------------------------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS — DATA INTEGRITY
-- ------------------------------------------------------------------------------

-- 4.1 updated_at helper: keep a strict search path.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Chat requests were missing the automatic updated_at trigger.
DROP TRIGGER IF EXISTS trg_chat_requests_updated_at ON public.chat_requests;
CREATE TRIGGER trg_chat_requests_updated_at
  BEFORE UPDATE ON public.chat_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4.2 Profile age integrity.
--     The age shown to other members is always derived from the (private)
--     birth date, so it can never be forged by updating the profiles row.
--
--     4.2.a The validation trigger keeps rejecting under-18 dates, but it no
--           longer writes to public.profiles: the age is now synchronized by a
--           separate AFTER trigger, so an UPDATE of birth_date cannot be
--           overwritten by the old value of the row.
CREATE OR REPLACE FUNCTION public.handle_profile_private_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Strict Under-18 rejection at the database level
  IF NEW.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'التسجيل متاح فقط للبالغين بعمر 18 سنة فما فوق.' USING ERRCODE = '23514';
  END IF;

  IF NEW.birth_date < (CURRENT_DATE - INTERVAL '120 years') THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- 4.2.b Synchronize the public age from the private birth date (AFTER write,
--        so the new date is already stored when the age is calculated).
CREATE OR REPLACE FUNCTION public.handle_profile_private_age_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated_age integer;
BEGIN
  calculated_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.birth_date))::integer;

  UPDATE public.profiles
  SET age = GREATEST(18, LEAST(120, calculated_age)),
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_private_age ON public.profile_private;
CREATE TRIGGER trg_sync_profile_private_age
  AFTER INSERT OR UPDATE OF birth_date ON public.profile_private
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_private_age_sync();

-- 4.2.c The public age column is always re-derived from the private birth
--        date, so a member can never claim a different age.
CREATE OR REPLACE FUNCTION public.sync_profile_age()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_birth_date date;
  v_age integer;
BEGIN
  SELECT birth_date INTO v_birth_date
  FROM public.profile_private
  WHERE user_id = NEW.id;

  IF v_birth_date IS NOT NULL THEN
    v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;
    NEW.age := GREATEST(18, LEAST(120, v_age));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_age ON public.profiles;
CREATE TRIGGER trg_sync_profile_age
  BEFORE INSERT OR UPDATE OF age ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_age();

-- 4.3 created_at is a system column: a member may never backdate their own
--     account to escape the 24 hour anti-spam window.
CREATE OR REPLACE FUNCTION public.protect_profile_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_system_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_system_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_system_columns();

-- 4.4 Anti-spam trigger for public rooms.
--     Now also rejects messages in inactive rooms and understands Arabic-Indic
--     digits and more link shapes.
CREATE OR REPLACE FUNCTION public.enforce_room_message_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_created_at timestamptz;
  room_is_active boolean;
BEGIN
  -- The target room must exist and be active.
  SELECT is_active INTO room_is_active
  FROM public.rooms
  WHERE id = NEW.room_id;

  IF room_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'هذه الغرفة غير متاحة حالياً.' USING ERRCODE = '42501';
  END IF;

  -- Check user ban status first
  IF public.is_banned(NEW.user_id) THEN
    RAISE EXCEPTION 'هذا الحساب محظور من المشاركة.' USING ERRCODE = '42501';
  END IF;

  SELECT created_at INTO profile_created_at
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If the account is less than 24 hours old, block links and phone numbers
  IF profile_created_at IS NOT NULL AND (now() - profile_created_at) < INTERVAL '24 hours' THEN
    IF NEW.content ~* '(https?://|ftp://|www\.|t\.me/|wa\.me/|telegram\.me/|[a-z0-9-]+\.(com|net|org|io|app|co|me|xyz|vip|link|site|online|shop|club)([^a-z]|$)|\+?[0-9]{8,15}|[٠-٩]{8,15})' THEN
      RAISE EXCEPTION 'لحماية المجتمع، لا يمكن للحسابات الجديدة إرسال روابط أو أرقام هواتف في الغرف العامة خلال أول 24 ساعة.' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4.5 Sign-up trigger: the 18+ rule is now enforced by the database itself.
--     A missing or invalid birth date can no longer create an account, and
--     metadata values are validated before they reach the table constraints.
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
  -- Birth date is mandatory and must prove 18+ at database level.
  IF NEW.raw_user_meta_data->>'birth_date' IS NULL
     OR btrim(NEW.raw_user_meta_data->>'birth_date') = '' THEN
    RAISE EXCEPTION 'تاريخ الميلاد مطلوب للتسجيل، والتسجيل متاح فقط للبالغين بعمر 18 سنة فما فوق.' USING ERRCODE = '23514';
  END IF;

  BEGIN
    v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END;

  IF v_birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'التسجيل متاح فقط للبالغين بعمر 18 سنة فما فوق.' USING ERRCODE = '23514';
  END IF;

  IF v_birth_date < (CURRENT_DATE - INTERVAL '120 years') THEN
    RAISE EXCEPTION 'تاريخ الميلاد غير صالح.' USING ERRCODE = '23514';
  END IF;

  v_nickname := coalesce(
    nullif(btrim(NEW.raw_user_meta_data->>'nickname'), ''),
    split_part(coalesce(NEW.email, 'user'), '@', 1)
  );
  v_nickname := left(v_nickname, 30);
  IF char_length(v_nickname) < 2 THEN
    v_nickname := 'مستخدم جديد';
  END IF;

  v_country := coalesce(nullif(btrim(NEW.raw_user_meta_data->>'country'), ''), 'مصر');
  v_city := coalesce(nullif(btrim(NEW.raw_user_meta_data->>'city'), ''), 'القاهرة');

  v_gender := nullif(btrim(NEW.raw_user_meta_data->>'gender'), '');
  IF v_gender IS NOT NULL AND v_gender NOT IN ('male', 'female') THEN
    v_gender := NULL;
  END IF;

  v_intent := coalesce(nullif(btrim(NEW.raw_user_meta_data->>'intent'), ''), 'both');
  IF v_intent NOT IN ('friendship', 'serious', 'both') THEN
    v_intent := 'both';
  END IF;

  v_age := EXTRACT(YEAR FROM age(CURRENT_DATE, v_birth_date))::integer;

  -- Insert or update the public profile
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

  -- Insert or update the private profile
  INSERT INTO public.profile_private (user_id, email, birth_date)
  VALUES (NEW.id, NEW.email, v_birth_date)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        birth_date = EXCLUDED.birth_date,
        updated_at = now();

  RETURN NEW;
END;
$$;

-- 4.6 Chat request status guard.
--     A request may only move from pending to accepted/declined, and it can
--     only be accepted when the conversation really exists.
CREATE OR REPLACE FUNCTION public.guard_chat_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'pending' AND OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'لا يمكن إعادة تفعيل طلب تمت معالجته.' USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.participant_one = LEAST(OLD.sender_id, OLD.receiver_id)
        AND c.participant_two = GREATEST(OLD.sender_id, OLD.receiver_id)
    ) THEN
      RAISE EXCEPTION 'لا يمكن قبول الطلب قبل إنشاء المحادثة.' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_chat_request_status ON public.chat_requests;
CREATE TRIGGER trg_guard_chat_request_status
  BEFORE UPDATE ON public.chat_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_chat_request_status();

-- ------------------------------------------------------------------------------
-- 5. SERVER SIDE FUNCTION: ACCEPT A CHAT REQUEST
--    The receiver cannot insert a message on behalf of the sender (Row Level
--    Security only allows writing your own messages), so the whole accept flow
--    runs inside one validated, transactional database function.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_chat_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_sender uuid;
  v_receiver uuid;
  v_initial_message text;
  v_status text;
  v_conversation_id uuid;
  v_participant_one uuid;
  v_participant_two uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول لإتمام هذا الإجراء.' USING ERRCODE = '42501';
  END IF;

  SELECT sender_id, receiver_id, initial_message, status
    INTO v_sender, v_receiver, v_initial_message, v_status
  FROM public.chat_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_receiver IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'طلب المحادثة غير موجود أو غير مخصص لك.' USING ERRCODE = '42501';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'تمت معالجة هذا الطلب مسبقاً.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = v_sender AND b.blocked_id = v_receiver)
       OR (b.blocker_id = v_receiver AND b.blocked_id = v_sender)
  ) THEN
    RAISE EXCEPTION 'لا يمكن فتح المحادثة بسبب وجود حظر بين الطرفين.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bans bn
    WHERE bn.user_id IN (v_sender, v_receiver)
      AND (bn.banned_until IS NULL OR bn.banned_until > now())
  ) THEN
    RAISE EXCEPTION 'لا يمكن فتح المحادثة بسبب حظر أحد الطرفين.' USING ERRCODE = '42501';
  END IF;

  v_participant_one := LEAST(v_sender, v_receiver);
  v_participant_two := GREATEST(v_sender, v_receiver);

  INSERT INTO public.conversations (participant_one, participant_two, updated_at)
  VALUES (v_participant_one, v_participant_two, now())
  ON CONFLICT (participant_one, participant_two)
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_conversation_id;

  -- The first message keeps the original author.
  INSERT INTO public.messages (conversation_id, sender_id, content, is_read)
  VALUES (v_conversation_id, v_sender, v_initial_message, false);

  UPDATE public.chat_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_request_id;

  RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_chat_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_chat_request(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. FUNCTION PRIVILEGES
--    Helper functions are no longer executable by every role (including anon).
--    They stay available to the authenticated role because the RLS policies
--    call them.
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_banned(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_blocked(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_own_user() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_banned(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_blocked(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_own_user() FROM anon;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_user() TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. VERIFICATION HELPERS (read only, safe to run)
-- ------------------------------------------------------------------------------
-- Every table must have RLS enabled:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Policies per table:
--   SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- Age must always match the private birth date:
--   SELECT p.id, p.age, pp.birth_date FROM public.profiles p JOIN public.profile_private pp ON pp.user_id = p.id;
-- ==============================================================================
