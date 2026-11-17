import type { ReactNode } from "react";

export type AlertTone = "error" | "success" | "warning" | "info";

/**
 * Alert sizes only change padding and text size, so the recipes never fight
 * over the same CSS property.
 */
export type AlertSize = "sm" | "md" | "lg";

export interface AlertProps {
  tone?: AlertTone;
  size?: AlertSize;
  /** Font weight of the message text. */
  weight?: "normal" | "medium" | "semibold";
  /**
   * Extra classes for the wrapper. Only use them for properties that are not
   * already covered by `tone` / `size` / `weight`.
   */
  className?: string;
  children: ReactNode;
}

const TONE_STYLES: Record<AlertTone, string> = {
  error: "border-[#FF453A]/35 bg-[#FF453A]/15 text-[#FF9B95] backdrop-blur-md",
  success: "border-[#30D158]/35 bg-[#30D158]/15 text-[#7AE897] backdrop-blur-md",
  warning: "border-[#FF9F0A]/35 bg-[#FF9F0A]/15 text-[#FFD080] backdrop-blur-md",
  info: "border-[#0A84FF]/30 bg-[#0A84FF]/12 text-[#80C1FF] backdrop-blur-md",
};

const SIZE_STYLES: Record<AlertSize, string> = {
  sm: "p-2.5 text-xs",
  md: "p-3 text-xs",
  lg: "p-4 text-sm",
};

const WEIGHT_STYLES = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
} as const;

/**
 * Inline status message used for validation errors, confirmations and hints.
 * Error alerts are announced immediately, the others politely.
 */
export function Alert({
  tone = "error",
  size = "lg",
  weight = "medium",
  className = "",
  children,
}: AlertProps) {
  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-2xl border ${TONE_STYLES[tone]} ${SIZE_STYLES[size]} ${WEIGHT_STYLES[weight]} ${className}`}
    >
      {children}
    </div>
  );
}
