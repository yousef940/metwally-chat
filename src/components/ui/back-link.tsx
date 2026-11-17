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
      className={`ios-btn-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#409CFF] transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${className}`}
    >
      <span aria-hidden="true">→</span>
      {children}
    </Link>
  );
}
