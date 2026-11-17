import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "تسجيل الدخول - عائلة الحاج متولي",
  description: "سجّل دخولك إلى شات عائلة الحاج متولي",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-l from-white via-[#F4E8D3] to-[#409CFF] bg-clip-text text-2xl sm:text-3xl font-black text-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            عائلة الحاج متولي
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            مرحباً بك مجدداً
          </h1>
          <p className="mt-2 text-sm text-white/60">
            أدخل اسمك المستعار وكلمة المرور للمتابعة إلى الشات
          </p>
        </div>

        {/* Card */}
        <div className="ios-glass rounded-[30px] p-6 sm:p-8">
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-white/60">جاري التحميل...</div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
