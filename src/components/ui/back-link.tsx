import Link from "next/link";
import type { ReactNode } from "react";

export interface BackLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * "Back" navigation link.
 *
 * The arrow points to the right because the interface is RTL: the reading
 * direction goes from right to left, so going back means moving to the right.
 */
export function BackLink({ href, children, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-xs font-semibold text-coral transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${className}`}
    >
      <span aria-hidden="true">→</span>
      {children}
    </Link>
  );
}
