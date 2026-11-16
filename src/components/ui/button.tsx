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
    "bg-coral text-white shadow-sm hover:bg-coral-hover focus-visible:outline-coral",
  outline:
    "border border-coral text-coral hover:bg-coral/10 focus-visible:outline-coral",
  ghost: "text-ink hover:bg-ink/5 focus-visible:outline-ink",
  subtle:
    "border border-ink/20 bg-white text-ink hover:bg-ink/5 focus-visible:outline-ink",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3.5 text-base",
};

const BASE_STYLES =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

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
