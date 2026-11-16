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
          className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          حذف الحساب نهائياً
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <h3 className="text-base font-bold text-red-800">
            هل أنت متأكد من رغبتك في حذف حسابك؟
          </h3>
          <p className="mt-1 text-sm text-red-700">
            هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بيانات ملفك الشخصي ومحادثاتك ورسائلك بالكامل من خوادم صحبة.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-100 p-2.5 text-sm font-medium text-red-800"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {isPending ? "جاري الحذف..." : "نعم، احذف حسابي الآن"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center rounded-xl border border-ink/20 bg-white px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
