import { IconMale, IconFemale } from "@/components/ui/icons";

interface GenderBadgeProps {
  gender?: "male" | "female" | null | string;
  /** When false only the symbol is shown, so an accessible label is added. */
  showText?: boolean;
  className?: string;
}

/**
 * Small badge that shows the member gender using crisp iOS-style vector icons.
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
        className={`inline-flex items-center gap-1 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/15 px-2.5 py-0.5 text-xs font-semibold text-[#64D2FF] ${className}`}
      >
        <IconMale size={13} className="text-[#0A84FF]" />
        {showText && <span>ذكر</span>}
      </span>
    );
  }

  return (
    <span
      title="شابة / أنثى"
      aria-label={showText ? undefined : "أنثى"}
      className={`inline-flex items-center gap-1 rounded-full border border-[#FF375F]/30 bg-[#FF375F]/15 px-2.5 py-0.5 text-xs font-semibold text-[#FF6482] ${className}`}
    >
      <IconFemale size={13} className="text-[#FF375F]" />
      {showText && <span>أنثى</span>}
    </span>
  );
}
