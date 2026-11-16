import type { ReactNode } from "react";
import Image from "next/image";

export type AvatarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
  /** Image URL. Falls back to the first letter of the name when empty. */
  src?: string | null;
  /** Person name, used for the alternative text and the fallback letter. */
  name: string;
  size?: AvatarSize;
  /** `circle` for people, `rounded` for the square-ish member cards. */
  shape?: "circle" | "rounded";
  /** Extra classes for the frame, e.g. a border color. */
  className?: string;
  /** Classes for the inner wrapper (border, background). */
  frameClassName?: string;
  /** Classes for the fallback letter, e.g. the brand coral. */
  fallbackClassName?: string;
  /** Replaces the fallback letter with a custom node (e.g. a placeholder icon). */
  fallback?: ReactNode;
}

const SIZE_STYLES: Record<AvatarSize, string> = {
  xxs: "h-8 w-8",
  xs: "h-9 w-9",
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
  "2xl": "h-28 w-28",
};

const SHAPE_STYLES = {
  circle: "rounded-full",
  rounded: "rounded-2xl",
} as const;

/**
 * Avatar with an initial letter fallback, shared by every place that shows a
 * member picture (cards, chat headers, admin tables, block list).
 */
export function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  className = "",
  frameClassName = "border border-ink/10 bg-cream",
  fallbackClassName = "font-bold text-ink/40",
  fallback,
}: AvatarProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${SIZE_STYLES[size]} ${SHAPE_STYLES[shape]} ${frameClassName} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}
        >
          {fallback ?? (name.charAt(0) || "؟")}
        </div>
      )}
    </div>
  );
}
