import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10">
        <span aria-hidden="true" className="text-6xl font-extrabold text-coral">
          404
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو قد تم نقلها.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-coral px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:w-auto"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
