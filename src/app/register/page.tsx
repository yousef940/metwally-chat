import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "إنشاء حساب جديد - عائلة الحاج متولي",
  description: "سجّل في شات عائلة الحاج متولي للمحادثات والدردشة",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-l from-white via-[#F4E8D3] to-[#409CFF] bg-clip-text text-2xl sm:text-3xl font-black text-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            عائلة الحاج متولي
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            إنشاء حساب جديد
          </h1>
          <p className="mt-2 text-sm text-white/60">
            سجّل باسمك المستعار وسنة ميلادك وابدأ الدردشة فوراً
          </p>
        </div>

        {/* Card */}
        <div className="ios-glass rounded-[30px] p-6 sm:p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
