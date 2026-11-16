# Sohba: Task List (Phase 1)

Work on one task at a time, in order. After each task: run lint and build, fix errors, summarize, and tick the box.
`AGENTS.md` is the source of truth for product and safety rules. If a task conflicts with it, stop and ask.

- [x] Task 1: Project setup
- [x] Task 2: Supabase and database
- [x] Task 3: Authentication
- [x] Task 4: Profiles
- [x] Task 5: Public rooms
- [x] Task 6: Private messages
- [x] Task 7: Discover members
- [x] Task 8: Safety tools
- [x] Task 9: Admin panel
- [x] Task 10: PWA, polish and launch prep

---

## Task 1: Project setup
Goal: an empty but correct foundation. No features, no backend.
- Next.js (latest stable, App Router, TypeScript), Tailwind CSS, ESLint, npm. Package name `sohba`.
- RTL-first: `<html lang="ar" dir="rtl">`, logical utilities only.
- Cairo font (Arabic + Latin subsets) via `next/font/google` as the default font.
- Design tokens from AGENTS.md as CSS variables mapped to Tailwind theme colors, plus a dark theme (`data-theme="dark"`).
- Folders: `src/app`, `src/components/ui`, `src/lib`.
- Home page (`src/app/page.tsx`): title "صحبة", tagline "مكانك للتعارف والدردشة", a primary coral button "ابدأ الآن" and an outlined button "تسجيل الدخول" (no action yet). Mobile-first, good from 360px to desktop.
- Metadata: title "صحبة", an Arabic description, a proper viewport.
- README with install and run steps, and an empty `.env.example`.
Done when: `npm run dev` works, the page is RTL with the right font and colors, lint and build pass.

## Task 2: Supabase and database
Goal: a secure backend foundation.
- Install the Supabase client. Add placeholders to `.env.example` for the Supabase URL and the public (anon/publishable) key. The owner creates the Supabase project and puts real keys in `.env.local`: explain these steps simply.
- SQL migrations in `supabase/migrations` for: profiles, rooms, room_messages, conversations, messages, chat_requests, blocks, reports, bans.
- Row Level Security on every table with explicit policies: users read/write only what they should, blocked users cannot read or write each other's messages, only admins can read reports and bans.
- Seed a few public rooms (by country and topic).
Done when: migrations apply cleanly, RLS is on for all tables, and the policies are explained in a short summary.

## Task 3: Authentication
- Sign up with email and password, sign in, sign out, password reset.
- Birth date is required at sign-up; block anyone under 18.
- Accept terms and privacy policy (placeholder pages for now).
- Account deletion that removes the user's data.
- Protected routes with sensible redirects. All messages in Arabic.
Done when: the full auth flow works and under-18 sign-up is rejected.

## Task 4: Profiles
- View and edit profile: nickname, avatar upload (Supabase Storage), short bio, interests, country, city (never exact location), "I'm here for": friendship / serious / both.
- Birth date is stored but only the age is shown. Email is never shown to others.
- OPEN DECISION: whether the profile has a gender field and gender filters. Ask the owner before building the profile.
Done when: a user can create, edit and view profiles with correct privacy.

## Task 5: Public rooms
- Room list grouped by country and topic.
- Realtime messages, online count and member list inside a room.
- Room rules shown on entry; each room can have moderators.
- New accounts cannot post links or phone numbers.
- Rooms use the dark theme.
Done when: two browsers can chat in a room in realtime.

## Task 6: Private messages
- One-to-one realtime chat with an inbox.
- The first message to someone who does not follow up is a chat request that the other person can accept or decline.
- Read receipts and mute conversation.
Done when: two users can send a request, accept it and chat.

## Task 7: Discover members
- Member list with filters: country, age range, "I'm here for".
- Respect blocks. Paginate the list.
Done when: filters work and blocked users never appear.

## Task 8: Safety tools
- Report a message, user or room.
- Block and unblock users.
- Arabic bad-words filter covering several dialects, with a configurable word list.
- Rate limiting on sending messages.
- A visible safety tips notice about scams, blackmail and sharing sensitive information.
Done when: reports are saved, blocking works everywhere, and spam is limited.

## Task 9: Admin panel
- Admin-only area.
- Review reports, temporary and permanent bans, delete messages.
- Manage rooms and moderators.
- Basic stats: registered users, active users, reports.
Done when: an admin can handle a report from start to finish.

## Task 10: PWA, polish and launch prep
- Installable PWA: manifest, placeholder icons, offline fallback page.
- Mobile polish and a basic accessibility pass.
- Test the main flows end to end and deploy a preview.
- Pre-launch checklist: legal pages reviewed, environment variables set, backups.
Done when: the preview deployment works on a phone and the checklist is complete.
