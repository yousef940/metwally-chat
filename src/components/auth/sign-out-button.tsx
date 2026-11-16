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
      className={`inline-flex items-center justify-center rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {isPending ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
