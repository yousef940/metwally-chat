-- ==============================================================================
-- 0002_profiles_and_storage.sql: Storage & Profile Enhancements
-- Description: Adds interests column to profiles, configures the avatars storage
--              bucket with RLS, and installs the automatic auth signup trigger.
-- ==============================================================================

-- 1. Add interests column to profiles if not present
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- 2. Ensure gender is constrained to male / female
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female'));

-- 3. Automatic Profile Creation Trigger on Sign-up
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

  -- Insert or update profile
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

  -- Insert or update private profile
  INSERT INTO public.profile_private (user_id, email, birth_date)
  VALUES (NEW.id, NEW.email, v_birth_date)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        birth_date = EXCLUDED.birth_date,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Create Avatars Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage RLS Policies for Avatars
-- Everyone can view avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar into folder matching their auth.uid()
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
  )
  WITH CHECK (
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
