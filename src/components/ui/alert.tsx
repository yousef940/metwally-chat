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
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-ink/15 bg-cream/60 text-ink/80",
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
      className={`rounded-xl border ${TONE_STYLES[tone]} ${SIZE_STYLES[size]} ${WEIGHT_STYLES[weight]} ${className}`}
    >
      {children}
    </div>
  );
}
