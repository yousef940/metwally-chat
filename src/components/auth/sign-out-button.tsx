"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton({ className = "" }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={`ios-btn-glass inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold text-white/85 transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 ${className}`}
    >
      {isPending ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
