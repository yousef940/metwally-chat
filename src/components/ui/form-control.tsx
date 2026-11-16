/**
 * Shared class recipes for form controls.
 *
 * Every form in the app uses the same recipes so inputs, selects and textareas
 * keep identical spacing, colors and focus rings. Sizes:
 * - `*ClassName` are the standard large controls used by the member facing forms.
 * - `compact*ClassName` are the smaller controls used inside admin tables and dialogs.
 */

export const inputClassName =
  "mt-1 block w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base text-ink transition-colors placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

export const selectClassName =
  "mt-1 block w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-base text-ink transition-colors focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

export const textareaClassName =
  "mt-1 block w-full rounded-xl border border-ink/20 bg-white p-3.5 text-base text-ink transition-colors placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

export const compactInputClassName =
  "w-full rounded-xl border border-ink/15 bg-cream/20 px-3 py-2.5 text-xs text-ink transition-colors placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";

export const compactSelectClassName =
  "w-full rounded-xl border border-ink/15 bg-cream/20 px-3 py-2.5 text-xs text-ink transition-colors focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";

export const compactTextareaClassName =
  "w-full rounded-xl border border-ink/15 bg-cream/20 p-2.5 text-xs text-ink transition-colors placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral";
