# Sohba (صحبة) — Technical Architecture Guide

This document describes the software architecture, data flow, security model, and engineering decisions implemented in **Sohba**. Any developer working on this project should read this document to understand how the system components interact.

---

## 1. System Overview

Sohba is designed as a unified full-stack web application that serves both desktop and mobile users from a single codebase (installable as a PWA).

```
+---------------------------------------------------------------------------------+
|                               Client / Browser                                  |
|  - Next.js 16 App Router (React 19 Server & Client Components)                  |
|  - RTL-First UI with Cairo Font & Tailwind CSS v4 Logical Utilities             |
|  - Supabase Realtime Client (Message streaming & Presence online tracking)      |
|  - PWA Service Worker (Offline fallback & asset caching)                        |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                           Next.js Application Layer                             |
|  - Middleware: Session token refresh, route protection (/admin, /messages, etc) |
|  - Server Actions: Mutating operations (Auth, Chat requests, Rooms, Safety)     |
|  - In-Memory Sliding-Window Rate Limiter & Arabic Multi-Dialect Profanity Filter|
|  - SSR Data Fetchers: Server-side queries with user cookie authentication       |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                                Supabase Backend                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  |   Supabase Auth    |  |  PostgreSQL Database |  |    Supabase Realtime    |  |
|  | - Email & Password |  | - 12 Tables with RLS |  | - Broadcast messages    |  |
|  | - User metadata    |  | - Under-18 Triggers  |  | - Presence member state |  |
|  | - Cookie sessions  |  | - Admin / Ban checks |  | - Postgres changes      |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
|                                        |                                        |
|                                        v                                        |
|                          +---------------------------+                          |
|                          |     Supabase Storage      |                          |
|                          | - Avatars public bucket   |                          |
|                          | - User-restricted upload  |                          |
|                          +---------------------------+                          |
+---------------------------------------------------------------------------------+
```

---

## 2. Next.js App Router Architecture

### 2.1 Server Components vs. Client Components
* **Server Components (Default)**: Used for data fetching, initial page renders, and security verification (e.g., `/discover`, `/rooms`, `/messages`, `/profile/[id]`, `/admin/*`). These components fetch data directly using `createServerClient` from `@supabase/ssr`, reducing bundle size and preventing client-side data leaks.
* **Client Components (`"use client"`)**: Isolated strictly to interactive leaves:
  - Form state and actions (`ProfileEditForm`, `LoginForm`, `RegisterForm`).
  - Realtime subscribers (`RoomChat`, `PrivateChat`).
  - Modals and dialogs (`SendRequestModal`, `ReportModal`, `BlockButton`).
  - Filter state management (`DiscoverFilters`).

### 2.2 Server Actions (`src/lib/actions/*`)
All mutations occur via Next.js Server Actions with server-side validation:
* `auth.ts`: Sign up (validates 18+ birth date), sign in, sign out, password update, and account deletion.
* `profile.ts`: Updates nickname, avatar URL, bio, interests, country, city, and intent.
* `rooms.ts`: Sends room messages, enforces anti-spam and profanity filters, and handles message deletions.
* `messages.ts`: Manages chat requests (send, accept, decline), private 1-to-1 messages, read receipts, and muting.
* `safety.ts`: User blocking/unblocking, official abuse reports, and blocked user management.
* `admin.ts`: Moderation actions (status updates, temporary/permanent bans, message deletion, and room management).

### 2.3 Route Protection & Middleware (`src/middleware.ts`)
* Uses `@supabase/ssr` to refresh session cookies on every request.
* Protected prefixes: `/rooms`, `/messages`, `/discover`, `/profile`, `/settings`, and `/admin`.
* Automatically redirects unauthenticated requests to `/login?redirect=<path>`.
* Redirects authenticated users attempting to visit `/login` or `/register` back to home (`/`).

---

## 3. Privacy & Security Architecture

### 3.1 Two-Tier Profile Architecture
In Supabase, Row Level Security (RLS) operates on rows rather than columns. To guarantee sensitive data (email and exact birth date) is **never** leaked to other users, the data is partitioned:

1. **`public.profiles` (Public)**:
   - Contains: `id`, `nickname`, `avatar_url`, `bio`, `gender`, `intent`, `country`, `city`, `age`, `interests`.
   - **Never contains email or birth date.**
   - Visible to all authenticated users (unless mutually blocked).

2. **`public.profile_private` (Strictly Confidential)**:
   - Contains: `user_id`, `email`, `birth_date`.
   - RLS strictly limits read/write access to the row owner (`auth.uid() = user_id`) and verified administrators.

### 3.2 Under-18 Database Trigger Enforcement
PostgreSQL requires CHECK constraints to be immutable (disallowing `CURRENT_DATE`). Therefore, under-18 protection is enforced at the database level via a `BEFORE INSERT OR UPDATE` trigger:
```sql
CREATE OR REPLACE FUNCTION public.handle_profile_private_validation()
RETURNS trigger ...
BEGIN
  IF NEW.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'التسجيل متاح فقط للبالغين بعمر 18 سنة فما فوق.' USING ERRCODE = '23514';
  END IF;
  
  -- Automatically computes age in completed years and updates public.profiles
  NEW.birth_date ...
  UPDATE public.profiles SET age = calculated_age WHERE id = NEW.user_id;
END;
```

### 3.3 Mutual Block Enforcement (`is_blocked`)
A security definer SQL function `public.is_blocked(user_a, user_b)` checks if either user has blocked the other in `public.blocks`. RLS policies on `profiles`, `room_messages`, `conversations`, `messages`, and `chat_requests` invoke this function:
* Blocked users cannot view each other's profiles.
* Blocked users cannot see each other's room messages.
* Blocked users cannot send or receive direct messages or chat requests.

### 3.4 Content Safety & Anti-Spam Pipeline
Before any message is written to the database:
1. **Rate Limiting (`src/lib/safety/rate-limit.ts`)**: In-memory sliding-window token bucket checks request volume per user (e.g., max 5 room messages per 10 seconds, max 3 chat requests per 5 minutes).
2. **Account Age Anti-Spam (`src/lib/safety/filter.ts`)**: New accounts (< 24 hours old) are prohibited from posting telephone numbers or external URLs.
3. **Arabic Dialect Profanity Filter (`src/lib/safety/filter.ts`)**: Normalizes text (removes diacritics/tashkeel, tatweel, letter repetition, and unifies alef/teh marbuta) and checks against multi-dialect offensive patterns.

### 3.5 Role-Based Access Control (RBAC)
* Admin and moderator roles are stored in `public.user_roles`.
* Standard users have **no insert, update, or delete privileges** on `user_roles`.
* `public.is_admin(check_user_id)` returns `true` only if a corresponding row exists in `user_roles`.
* All `/admin/*` pages enforce server-side admin verification via `requireAdmin()`.

---

## 4. Realtime Layer (Streaming & Presence)

### 4.1 Public Chat Rooms (`src/components/rooms/room-chat.tsx`)
* **Message Streaming**: Listens to `postgres_changes` on `public.room_messages` filtered by `room_id=eq.<id>`. New messages appear instantly without page reloads.
* **Presence Tracking**: Uses Supabase Realtime Presence API (`room:slug`). When users join, their nickname, avatar, and gender badge are tracked in real time. The header displays an animated live member counter and opens an active participants drawer.

### 4.2 Private 1-to-1 Conversations (`src/components/messages/private-chat.tsx`)
* **Message Delivery**: Subscribes to `postgres_changes` on `public.messages` where `conversation_id=eq.<id>`.
* **Read Receipts**: Automatically triggers `markConversationAsRead` when the recipient opens the conversation, updating the status to `✓✓`.
* **Chat Request Gate**: Direct messages cannot be sent until the recipient accepts the sender's pending `chat_request`.

---

## 5. UI Design System & RTL Conventions

* **RTL-First**: The document root is `<html lang="ar" dir="rtl">`.
* **Logical Properties Rule**: Always use logical Tailwind CSS classes:
  - Margins: `ms-` (margin-inline-start), `me-` (margin-inline-end).
  - Padding: `ps-` (padding-inline-start), `pe-` (padding-inline-end).
  - Text alignment: `text-start`, `text-end`.
  - Borders: `border-s-`, `border-e-`, `rounded-ts-`, `rounded-te-`.
  - **Never use physical `left` or `right` utilities (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`).**
* **Brand Colors**:
  - Cream Background: `#FFF7EF` (`bg-cream`)
  - Primary Coral: `#F26B4F` (`bg-coral`, `text-coral`, `hover:bg-coral-hover`)
  - Deep Ink: `#12343B` (`text-ink`, `border-ink/10`)
  - Accent Gold: `#D9A441`
* **Room Theme**: Public rooms utilize dark mode styling (`bg-[#0B1E24]`, `text-[#FFF7EF]`, `border-[#20454E]`).

---

## 6. Progressive Web App (PWA) & Offline Architecture

* **Web App Manifest (`public/manifest.json`)**: Configured with Arabic metadata (`name`, `short_name`, `lang="ar"`, `dir="rtl"`), theme colors, and SVG icons.
* **Service Worker (`public/sw.js`)**: Caches static assets (`/`, `/manifest.json`, `/icons/icon.svg`) and intercepts navigation requests during network loss to display `/offline`.
* **Offline Fallback (`src/app/offline/page.tsx`)**: Friendly Arabic screen explaining the connection loss with a one-click reload button.
