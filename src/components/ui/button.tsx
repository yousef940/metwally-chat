import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "subtle"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "ios-btn-primary text-white focus-visible:outline-[#0A84FF]",
  outline:
    "border border-[#0A84FF]/40 bg-[#0A84FF]/12 text-[#409CFF] hover:bg-[#0A84FF]/22 hover:border-[#0A84FF]/60 focus-visible:outline-[#0A84FF]",
  ghost:
    "text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-white/40",
  subtle:
    "ios-btn-glass text-white focus-visible:outline-white/40",
  danger:
    "bg-[#FF453A] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_18px_-6px_rgba(255,69,58,0.5)] hover:bg-[#FF6961] focus-visible:outline-[#FF453A]",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-4.5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

const BASE_STYLES =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45";

/**
 * Builds the button class list so plain links and buttons share one visual
 * language. Use it when the element must be a `next/link` instead of a button.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  return [
    BASE_STYLES,
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleOptions {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "md", fullWidth = false, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`${buttonClassName({ variant, size, fullWidth })} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
