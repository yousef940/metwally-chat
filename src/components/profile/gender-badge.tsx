interface GenderBadgeProps {
  gender?: "male" | "female" | null | string;
  /** When false only the symbol is shown, so an accessible label is added. */
  showText?: boolean;
  className?: string;
}

/**
 * Small badge that shows the member gender. When the text is hidden the badge
 * keeps an `aria-label` so screen readers still announce it.
 */
export function GenderBadge({
  gender,
  showText = true,
  className = "",
}: GenderBadgeProps) {
  if (!gender) return null;

  if (gender === "male") {
    return (
      <span
        title="شاب / ذكر"
        aria-label={showText ? undefined : "ذكر"}
        className={`inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 ${className}`}
      >
        <span aria-hidden="true" className="text-sm font-bold leading-none text-sky-600">
          ♂
        </span>
        {showText && <span>ذكر</span>}
      </span>
    );
  }

  return (
    <span
      title="شابة / أنثى"
      aria-label={showText ? undefined : "أنثى"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ${className}`}
    >
      <span aria-hidden="true" className="text-sm font-bold leading-none text-coral">
        ♀
      </span>
      {showText && <span>أنثى</span>}
    </span>
  );
}
