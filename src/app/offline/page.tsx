"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <div
          aria-hidden="true"
          className="mb-4 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-4xl"
        >
          📡
        </div>

        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          أنت غير متصل بالإنترنت
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          يبدو أنك فقدت الاتصال بالإنترنت حالياً. يرجى التحقق من اتصال الشبكة وإعادة المحاولة للوصول إلى محادثاتك وغرف صحبة.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <span aria-hidden="true">🔄</span> إعادة المحاولة
          </button>
          <Link
            href="/"
            className="rounded-xl border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
