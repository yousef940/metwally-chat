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
            className="inline-block text-3xl font-extrabold text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            صحبة
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            استعادة كلمة المرور
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            أدخل بريدك الإلكتروني وسنساعدك في استعادة حسابك
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
