"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="ios-glass w-full max-w-md rounded-[30px] p-8">
        <div
          aria-hidden="true"
          className="mb-4 mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#FF9F0A]/30 bg-[#FF9F0A]/15 text-4xl"
        >
          📡
        </div>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          أنت غير متصل بالإنترنت
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/60">
          يبدو أنك فقدت الاتصال بالإنترنت حالياً. يرجى التحقق من اتصال الشبكة وإعادة المحاولة للوصول إلى محادثاتك وغرف صحبة.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ios-btn-primary rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            <span aria-hidden="true">🔄</span> إعادة المحاولة
          </button>
          <Link
            href="/"
            className="ios-btn-glass rounded-full px-6 py-3 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
