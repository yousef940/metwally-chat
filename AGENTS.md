# Sohba (صحبة): Project Rules

## What this project is
Sohba is an Arabic social / dating chat platform for the whole Arab world. It runs on desktop and mobile from one codebase (a web app that can be installed as a PWA).
Goals: friendship and chatting, and serious acquaintance (marriage-oriented). All users are adults (18+).

The product owner is not a professional developer and builds with AI tools. Explain what you did in simple terms, one task at a time.
Package name is `sohba` (lowercase). The project folder name may be different (it can contain capital letters).

## Stack
- Next.js (App Router, TypeScript), Tailwind CSS, ESLint, npm.
- Supabase later: Auth, Postgres (with Row Level Security), Realtime, Storage.
- Deployment later: a Next.js-friendly host (for example Vercel).
- Phase 2 only: a small Node.js + WebSocket server for random one-to-one chat.

## Scope
- Phase 1 (current): accounts, profiles, public rooms, private messages, member discovery, report/block, basic admin panel, PWA.
- NOT in phase 1, do not build: random chat, friends/followers, voice/video calls, payments, app-store apps.

## Language and RTL
- The UI is Arabic and RTL-first: `<html lang="ar" dir="rtl">`.
- Use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`). Never use physical left/right.
- All user-facing text is Arabic: simple, friendly, understandable in all Arab dialects (avoid one country's slang).
- Code, comments, commit messages and variable names are in English.

## Design tokens
- Background cream `#FFF7EF`, primary coral `#F26B4F` (slightly darker on hover), ink (text/headings) `#12343B`, accent gold `#D9A441`.
- Font: Cairo (via `next/font/google`).
- Dark theme (`data-theme="dark"`) for the public chat rooms.
- Mobile-first: must look good from 360px wide up to desktop.
- Feel: warm and friendly base, elegant accents for serious-acquaintance parts, lively dark rooms.

## Security and safety rules (always apply)
- Never commit secrets. Use `.env.local` for real keys and keep `.env.example` with empty placeholders. Never put a service-role key in client code.
- Every database table has Row Level Security enabled with explicit policies.
- Validate input on the server, not only in the browser.
- Never expose exact location, email or birth date to other users. Only age, country and city are visible.
- Block and report must be respected everywhere (a blocked user cannot message the blocker or see their profile).
- New accounts cannot post links or phone numbers in public rooms (anti-spam / anti-scam).
- Never weaken a safety rule to make a feature easier. If a rule blocks something, stop and ask.

## Working rules
- Work on ONE task at a time from `docs/TASKS.md`, in order. Do not start the next task.
- For big changes, state a short plan first. Keep changes small and focused.
- Add only dependencies that are truly needed, and say why.
- After each task: run lint and build, fix errors, then summarize what changed, how to run and test it, and anything I must do manually (for example adding keys). Then tick the task in `docs/TASKS.md`.
- If a requirement is unclear, ask instead of guessing.
- Keep code simple and readable. Comment only what is not obvious.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
