import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="ios-glass w-full max-w-md rounded-[30px] p-8 sm:p-10">
        <span
          aria-hidden="true"
          className="bg-gradient-to-b from-white to-[#409CFF] bg-clip-text text-6xl font-black text-transparent"
        >
          404
        </span>
        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-sm text-white/60">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو قد تم نقلها.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="ios-btn-primary inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-base font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] sm:w-auto"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
