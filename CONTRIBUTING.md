# Contributing to Sohba (صحبة)

Thank you for contributing to Sohba! This guide outlines the engineering practices, coding conventions, and security rules that every developer working on this codebase must follow.

---

## 1. Core Principles & Safety Rules (Always Apply)

* **Adults Only (18+)**: Sohba is strictly for adults. Never bypass or relax age validation at the client, server action, or database level.
* **Privacy by Design**: Other users must **never** be able to see email addresses or birth dates. Only computed age, country, and city are public.
* **Zero Secrets in Code**: Never commit secret keys or tokens. Use `.env.local` for local secrets and keep `.env.example` with empty placeholders. Never expose Supabase `service_role` keys in client-accessible code.
* **RLS on Every Table**: Every database table must have Row Level Security enabled with explicit policies. Deny by default.
* **Respect Blocks Everywhere**: A blocked user must not be able to message the blocker or view their profile under any circumstances.
* **Anti-Spam Discipline**: New accounts cannot post links or phone numbers in public rooms.

---

## 2. Language & RTL Guidelines

### 2.1 Code vs. UI Language
* **Code, Comments & Commits**: Write all code, variable names, types, function names, and technical comments in **English**.
* **User-Facing UI**: All user-visible text, error messages, toast alerts, placeholders, and tooltips must be in **Arabic** (neutral, friendly, and understandable across the Arab world).

### 2.2 RTL-First CSS Rules
The application runs strictly in RTL mode (`<html lang="ar" dir="rtl">`).
* **Always use logical Tailwind CSS utilities**:
  - `ms-` / `me-` (instead of `ml-` / `mr-`)
  - `ps-` / `pe-` (instead of `pl-` / `pr-`)
  - `text-start` / `text-end` (instead of `text-left` / `text-right`)
  - `border-s-` / `border-e-` (instead of `border-l-` / `border-r-`)
  - `rounded-ts-` / `rounded-te-` / `rounded-bs-` / `rounded-be-`
* **Never use physical left/right classes** (`left-`, `right-`, `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`).

---

## 3. Design System & Tokens

* **Background Cream**: `#FFF7EF` (`bg-cream`)
* **Primary Coral**: `#F26B4F` (`bg-coral`, `text-coral`, `hover:bg-coral-hover`)
* **Deep Ink**: `#12343B` (`text-ink`, `border-ink/10`)
* **Accent Gold**: `#D9A441`
* **Default Font**: Cairo via `next/font/google`
* **Mobile-First**: Every screen must look clean from **360px** width up to 4K desktop screens.

---

## 4. Architecture & Development Guidelines

1. **Server Components First**: Keep pages and data-fetching components as React Server Components. Use `"use client"` only for interactive elements (forms, dialogs, realtime event listeners).
2. **Server Actions for Mutations**: Place all data mutations in `src/lib/actions/*.ts`. Always validate inputs and check authentication inside the action.
3. **Keep Dependencies Minimal**: Do not introduce heavy libraries for trivial needs. Explain any new package addition in pull requests.
4. **Clean Code & Comments**: Write concise, descriptive English comments explaining non-obvious business logic, security guards, or architectural decisions.

---

## 5. Pre-PR Checklist

Before opening a pull request or pushing code, ensure that:

1. **Linting passes with zero errors and warnings**:
   ```bash
   npm run lint
   ```
2. **TypeScript passes with zero type errors**:
   ```bash
   npm run typecheck
   ```
3. **Production build succeeds**:
   ```bash
   npm run build
   ```
4. **Responsive UI checked**: Tested on mobile viewport (360px) and desktop.
5. **No secrets or `.env.local` staged**: Verify with `git status`.
