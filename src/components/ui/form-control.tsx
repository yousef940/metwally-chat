/**
 * Shared class recipes for form controls.
 *
 * Every form in the app uses the same recipes so inputs, selects and textareas
 * keep identical spacing, colors and focus rings. Sizes:
 * - `*ClassName` are the standard large controls used by the member facing forms.
 * - `compact*ClassName` are the smaller controls used inside admin tables and dialogs.
 */

export const inputClassName =
  "mt-1.5 block w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/75 px-4 py-3 text-base text-white backdrop-blur-md transition-all placeholder:text-white/35 focus:border-[#0A84FF] focus:bg-[#2C2C2E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";

export const selectClassName =
  "mt-1.5 block w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/75 px-4 py-3 text-base text-white backdrop-blur-md transition-all focus:border-[#0A84FF] focus:bg-[#2C2C2E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";

export const textareaClassName =
  "mt-1.5 block w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/75 p-4 text-base text-white backdrop-blur-md transition-all placeholder:text-white/35 focus:border-[#0A84FF] focus:bg-[#2C2C2E] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";

export const compactInputClassName =
  "w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/80 px-3.5 py-2.5 text-xs text-white transition-all placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";

export const compactSelectClassName =
  "w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/80 px-3.5 py-2.5 text-xs text-white transition-all focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";

export const compactTextareaClassName =
  "w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/80 p-3 text-xs text-white transition-all placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25";
