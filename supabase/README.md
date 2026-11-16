# Supabase Migrations & Database Setup Guide

This directory contains the SQL migration files for the **Sohba (صحبة)** platform.

---

## 1. Migration Files & Execution Order

When setting up a new Supabase database or deploying updates, apply the SQL files in this exact sequence using the **SQL Editor** in the Supabase Dashboard:

### 1. `0001_init.sql` (Core Schema & Initial Policies)
* Creates extensions (`pgcrypto`).
* Creates the core 11 tables: `profiles`, `profile_private`, `user_roles`, `bans`, `blocks`, `rooms`, `room_messages`, `conversations`, `messages`, `chat_requests`, `reports`.
* Defines security definer functions: `is_admin`, `is_banned`, `is_blocked`.
* Sets up under-18 validation trigger `trg_validate_birth_date` on `profile_private`.
* Sets up anti-spam link/phone filter trigger on `room_messages`.
* Enables Row Level Security (RLS) on all tables with explicit policies.
* Configures Supabase Realtime publication.
* Seeds 8 public chat rooms by Arab country and topic.

### 2. `0002_profiles_and_storage.sql` (Storage Bucket & Signup Trigger)
* Adds `interests text[]` column to `public.profiles`.
* Creates and configures the `avatars` storage bucket.
* Configures storage RLS policies for avatar image uploads and public read access.
* Creates `public.handle_new_user()` trigger for automated profile generation on signup.

### 3. `0003_private_messages.sql` (Conversation Muting)
* Creates the `public.conversation_mutes` table.
* Enables RLS and policies for user conversation muting preferences.

---

## 2. Setting Up an Admin User

To grant a user access to the Admin Dashboard (`/admin`):
1. Navigate to the **Authentication** tab in the Supabase Dashboard and copy the user's UUID.
2. In the **SQL Editor**, execute:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_UUID_HERE', 'admin')
   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```

---

## 3. Verifying RLS & Security

To verify that all tables have Row Level Security active:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
Every table must show `rowsecurity = true`.
