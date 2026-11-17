import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "استعادة كلمة المرور - صحبة",
  description: "استعادة كلمة المرور لحسابك في منصة صحبة",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-l from-white via-[#F4E8D3] to-[#409CFF] bg-clip-text text-3xl font-black text-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            صحبة
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            استعادة كلمة المرور
          </h1>
          <p className="mt-2 text-sm text-white/60">
            أدخل بريدك الإلكتروني وسنساعدك في استعادة حسابك
          </p>
        </div>

        <div className="ios-glass rounded-[30px] p-6 sm:p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
