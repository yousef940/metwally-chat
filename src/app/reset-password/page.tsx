import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "تعيين كلمة المرور الجديدة - صحبة",
  description: "أدخل كلمة المرور الجديدة لحسابك في منصة صحبة",
};

export default function ResetPasswordPage() {
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
            تعيين كلمة مرور جديدة
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            أدخل كلمة المرور الجديدة لتتمكن من الدخول إلى حسابك
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
