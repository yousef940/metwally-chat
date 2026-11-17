"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/lib/actions/auth";

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteAccount();
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-full border border-[#FF453A]/35 bg-[#FF453A]/15 px-5 py-2.5 text-sm font-semibold text-[#FF8982] transition-all hover:bg-[#FF453A]/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
        >
          حذف الحساب نهائياً
        </button>
      ) : (
        <div className="rounded-2xl border border-[#FF453A]/35 bg-[#2A1415] p-4">
          <h3 className="text-base font-bold text-[#FF6961]">
            هل أنت متأكد من رغبتك في حذف حسابك؟
          </h3>
          <p className="mt-1 text-sm text-white/75">
            هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بيانات ملفك الشخصي ومحادثاتك ورسائلك بالكامل من خوادم صحبة.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-[#FF453A]/40 bg-[#FF453A]/20 p-2.5 text-sm font-medium text-[#FF9B95]"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-full bg-[#FF453A] px-5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all hover:bg-[#FF6961] active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
            >
              {isPending ? "جاري الحذف..." : "نعم، احذف حسابي الآن"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="ios-btn-glass inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
