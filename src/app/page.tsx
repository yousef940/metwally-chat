import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/profile";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/ui/app-footer";
import { PwaInstallButton } from "@/components/layout/pwa-install-button";
import { buttonClassName } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  IconUsers,
  IconMessages,
  IconDirectMessage,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "متولي شات - شات ومحادثات الأصدقاء",
  description: "الدردشة الجماعية والمحادثات المباشرة بين الأصدقاء",
};

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#0B1E24]">
      {/* Top Navbar */}
      <AppHeader user={user} profile={profile} />

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="w-full max-w-lg text-center">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-coral/15 px-4 py-1.5 border border-coral/30">
            <span className="text-sm font-bold text-coral">
              شات ومحادثات الأصدقاء
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            عائلة الحاج متولي
          </h1>

          {/* Tagline */}
          <p className="mt-3 text-base text-[#9CB3B8] sm:text-lg">
            منصتنا الخاصة للدردشة الجماعية والمحادثات المباشرة بين الأصدقاء
          </p>

          {/* PWA Install Banner */}
          <div className="mt-6 text-start">
            <PwaInstallButton variant="banner" />
          </div>

          {/* Logged in state vs Guest state */}
          {user ? (
            <div className="mt-6 rounded-3xl border border-[#20454E] bg-[#122A31] p-6 text-center shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.nickname || "مستخدم"}
                  size="xl"
                  frameClassName="border-2 border-coral shadow-md"
                  fallbackClassName="text-2xl font-bold text-coral"
                />

                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-white">
                    أهلاً بك، {profile?.nickname || user.email}!
                  </p>
                  <GenderBadge gender={profile?.gender} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <CountryBadge country={profile?.country} city={profile?.city} />
                {profile?.age && (
                  <span className="rounded-lg border border-[#20454E] bg-[#16353D] px-2.5 py-1 text-xs font-bold text-coral">
                    السن: {profile.age} سنة
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  href="/discover"
                  className="flex flex-col items-center justify-center rounded-2xl border border-coral/25 bg-coral/10 p-4 transition-all hover:border-coral hover:bg-coral/20 focus-visible:outline-2 focus-visible:outline-coral"
                >
                  <div className="mb-2 text-coral">
                    <IconUsers size={24} />
                  </div>
                  <span className="text-sm font-bold text-coral">الأعضاء</span>
                  <span className="mt-0.5 text-[11px] text-[#9CB3B8]">قائمة الأصدقاء</span>
                </Link>

                <Link
                  href="/rooms"
                  className="flex flex-col items-center justify-center rounded-2xl border border-[#20454E] bg-[#16353D] p-4 transition-all hover:border-coral/50 hover:bg-[#1C424D] focus-visible:outline-2 focus-visible:outline-coral"
                >
                  <div className="mb-2 text-white/80">
                    <IconMessages size={24} />
                  </div>
                  <span className="text-sm font-bold text-white">الدردشة الجماعية</span>
                  <span className="mt-0.5 text-[11px] text-[#9CB3B8]">الشات المباشر</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex flex-col items-center justify-center rounded-2xl border border-[#20454E] bg-[#16353D] p-4 transition-all hover:border-coral/50 hover:bg-[#1C424D] focus-visible:outline-2 focus-visible:outline-coral"
                >
                  <div className="mb-2 text-white/80">
                    <IconDirectMessage size={24} />
                  </div>
                  <span className="text-sm font-bold text-white">الرسائل الخاصة</span>
                  <span className="mt-0.5 text-[11px] text-[#9CB3B8]">المحادثات الفردية</span>
                </Link>
              </div>

              <div className="mt-5 border-t border-[#20454E] pt-3">
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-coral"
                >
                  عرض وتعديل ملفي الشخصي ←
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={`${buttonClassName({
                  variant: "primary",
                  size: "lg",
                })} w-full sm:w-auto shadow-md font-bold`}
              >
                إنشاء حساب جديد
              </Link>
              <Link
                href="/login"
                className={`${buttonClassName({
                  variant: "subtle",
                  size: "lg",
                })} w-full sm:w-auto border-[#20454E] bg-[#16353D] text-white hover:bg-[#1C424D]`}
              >
                تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
