# Sohba (صحبة) — Database Schema & RLS Reference

This document provides a complete technical specification of the PostgreSQL database backing the Sohba platform on Supabase, including table structures, constraints, Row Level Security (RLS) policies, triggers, and storage configurations.

---

## 1. Database Overview & Security Principles

1. **Deny by Default**: RLS is enabled on **every single table**. If no explicit policy matches a query, access is denied.
2. **Privacy Isolation**: Sensitive private fields (`email`, `birth_date`) are isolated in `public.profile_private`. The public `profiles` table only contains computed `age`.
3. **Under-18 Rejection**: A database trigger rejects any birth date corresponding to an age under 18 years.
4. **Mutual Blocking**: If User A blocks User B, neither user can see the other's profile, messages, or send chat requests.
5. **Admin Separation**: Roles are stored in `public.user_roles` where normal users have no insert or update privileges.

---

## 2. Table Catalog

### 2.1 `public.profiles`
Stores public-facing user profiles visible to members who are not blocked.
* `id` (`uuid`, PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `nickname` (`text`, NOT NULL, 2 to 30 characters)
* `avatar_url` (`text`, NULL)
* `bio` (`text`, NULL, max 500 characters)
* `gender` (`text`, NULL, CHECK `gender IN ('male', 'female')`)
* `intent` (`text`, NOT NULL, DEFAULT `'both'`, CHECK `intent IN ('friendship', 'serious', 'both')`)
* `country` (`text`, NOT NULL)
* `city` (`text`, NOT NULL)
* `age` (`integer`, NOT NULL, CHECK `age >= 18 AND age <= 120`)
* `interests` (`text[]`, DEFAULT `'{}'`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

### 2.2 `public.profile_private`
Stores sensitive, confidential data. Accessible only by the owner and admins.
* `user_id` (`uuid`, PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `email` (`text`, NULL)
* `birth_date` (`date`, NOT NULL)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

### 2.3 `public.user_roles`
Stores elevated privileges (admins and moderators). Protected from unauthorized user modification.
* `user_id` (`uuid`, PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `role` (`text`, NOT NULL, CHECK `role IN ('admin', 'moderator')`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

### 2.4 `public.bans`
Stores administrative ban records.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `user_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `reason` (`text`, NOT NULL)
* `banned_until` (`timestamptz`, NULL — `NULL` signifies a permanent ban)
* `banned_by` (`uuid`, REFERENCES `auth.users(id)` ON DELETE SET NULL)
* `created_at` (`timestamptz`, DEFAULT `now()`)

### 2.5 `public.blocks`
Stores mutual blocking relationships between users.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `blocker_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `blocked_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* Constraints: `CHECK (blocker_id <> blocked_id)`, `UNIQUE (blocker_id, blocked_id)`

### 2.6 `public.rooms`
Stores public chat rooms.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `slug` (`text`, NOT NULL, UNIQUE)
* `name` (`text`, NOT NULL)
* `description` (`text`, NULL)
* `country` (`text`, NULL)
* `topic` (`text`, NULL)
* `is_active` (`boolean`, NOT NULL, DEFAULT `true`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

### 2.7 `public.room_messages`
Stores messages posted in public rooms.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `room_id` (`uuid`, NOT NULL, REFERENCES `public.rooms(id)` ON DELETE CASCADE)
* `user_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `content` (`text`, NOT NULL, 1 to 2000 characters)
* `created_at` (`timestamptz`, DEFAULT `now()`)

### 2.8 `public.conversations`
Stores 1-to-1 conversation sessions.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `participant_one` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `participant_two` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)
* Constraints: `CHECK (participant_one < participant_two)`, `UNIQUE (participant_one, participant_two)`

### 2.9 `public.messages`
Stores direct messages within a conversation.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `conversation_id` (`uuid`, NOT NULL, REFERENCES `public.conversations(id)` ON DELETE CASCADE)
* `sender_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `content` (`text`, NOT NULL, 1 to 5000 characters)
* `is_read` (`boolean`, NOT NULL, DEFAULT `false`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

### 2.10 `public.chat_requests`
Stores initial contact requests before direct conversation begins.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `sender_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `receiver_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `initial_message` (`text`, NOT NULL, 1 to 1000 characters)
* `status` (`text`, NOT NULL, DEFAULT `'pending'`, CHECK `status IN ('pending', 'accepted', 'declined')`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)
* Constraints: `CHECK (sender_id <> receiver_id)`, `UNIQUE (sender_id, receiver_id)`

### 2.11 `public.conversation_mutes`
Stores user preferences for muting notifications per conversation.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `user_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `conversation_id` (`uuid`, NOT NULL, REFERENCES `public.conversations(id)` ON DELETE CASCADE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* Constraints: `UNIQUE (user_id, conversation_id)`

### 2.12 `public.reports`
Stores member abuse and violation reports.
* `id` (`uuid`, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
* `reporter_id` (`uuid`, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE)
* `target_type` (`text`, NOT NULL, CHECK `target_type IN ('user', 'message', 'room')`)
* `target_id` (`text`, NOT NULL)
* `reason` (`text`, NOT NULL)
* `details` (`text`, NULL)
* `status` (`text`, NOT NULL, DEFAULT `'pending'`, CHECK `status IN ('pending', 'investigating', 'resolved', 'dismissed')`)
* `reviewed_by` (`uuid`, REFERENCES `auth.users(id)` ON DELETE SET NULL)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `resolved_at` (`timestamptz`, NULL)

---

## 3. RLS Permissions Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Authenticated (if not blocked) | Owner (`auth.uid() = id`) | Owner (`auth.uid() = id`) | Owner / Admin |
| `profile_private` | Owner or Admin | Owner only | Owner only | Owner / Admin |
| `user_roles` | Authenticated | Admin only | Admin only | Admin only |
| `bans` | Owner (own ban) or Admin | Admin only | Admin only | Admin only |
| `blocks` | Blocker (`auth.uid() = blocker_id`) | Blocker (if not banned) | None | Blocker |
| `rooms` | Authenticated (active rooms) | Admin only | Admin only | Admin only |
| `room_messages` | Authenticated (if not blocked) | Author (if not banned) | None | Author or Admin |
| `conversations` | Participants (if not blocked) | Participants (if not blocked/banned) | None | Admin |
| `messages` | Participants (if not blocked) | Sender (if not blocked/banned) | Recipient (`is_read` flag) | Admin |
| `chat_requests` | Sender or Receiver | Sender (if not blocked/banned) | Receiver (accept/decline) | None |
| `conversation_mutes` | Owner (`auth.uid() = user_id`) | Owner | None | Owner |
| `reports` | Admins only | Authenticated (if not banned) | Admins only | Admins only |

---

## 4. Stored Procedures & Triggers

### 4.1 `public.is_admin(check_user_id uuid) RETURNS boolean`
Security definer function checking whether a given user holds the `admin` role in `public.user_roles`.

### 4.2 `public.is_banned(check_user_id uuid) RETURNS boolean`
Security definer function checking if the user currently has an active ban (`banned_until IS NULL OR banned_until > now()`).

### 4.3 `public.is_blocked(user_a uuid, user_b uuid) RETURNS boolean`
Security definer function checking whether a mutual block exists between `user_a` and `user_b` in `public.blocks`.

### 4.4 `public.handle_profile_private_validation()` (Trigger)
Runs `BEFORE INSERT OR UPDATE OF birth_date ON public.profile_private`:
1. Rejects any birth date resulting in an age < 18 or > 120 years.
2. Calculates exact age in completed years.
3. Automatically updates `public.profiles.age`.

### 4.5 `public.enforce_room_message_safety()` (Trigger)
Runs `BEFORE INSERT ON public.room_messages`:
1. Checks account age (< 24 hours).
2. Blocks any attempt to post phone numbers or URLs from new accounts.

---

## 5. Migration Execution Order

Migrations in `supabase/migrations/` must be run sequentially in the Supabase SQL Editor:
1. `0001_init.sql`: Core schema, 11 tables, RLS policies, seed rooms.
2. `0002_profiles_and_storage.sql`: Storage bucket configuration for `avatars`, signup profile trigger.
3. `0003_private_messages.sql`: `conversation_mutes` table and RLS policies.
