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
    <div className="flex min-h-screen flex-col justify-between">
      {/* Top Navbar */}
      <AppHeader user={user} profile={profile} />

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8 pb-28 md:pb-12">
        <div className="w-full max-w-xl text-center">
          {/* iOS 27 Liquid Glass Pill Badge */}
          <div className="ios-glass mb-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" aria-hidden="true" />
            <span className="text-xs font-semibold text-[#F4E8D3]">
              شات ومحادثات الأصدقاء
            </span>
          </div>

          {/* Large Title — iOS 27 Sculptural Champagne-White Gradient */}
          <h1 className="bg-gradient-to-b from-white via-white to-[#D2CBC4] bg-clip-text text-4xl sm:text-5xl font-black tracking-tight text-transparent leading-tight">
            عائلة الحاج متولي
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-base text-white/65 sm:text-lg leading-relaxed">
            منصتنا الخاصة للدردشة الجماعية والمحادثات المباشرة بين الأصدقاء
          </p>

          {/* PWA Install Banner */}
          <div className="mt-6 text-start">
            <PwaInstallButton variant="banner" />
          </div>

          {/* Logged in state vs Guest state */}
          {user ? (
            <div className="ios-glass mt-6 rounded-[30px] p-6 sm:p-7 text-center">
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.nickname || "مستخدم"}
                  size="xl"
                  frameClassName="border-2 border-white/25 bg-[#2C2C2E] shadow-[0_12px_28px_-8px_rgba(0,0,0,0.65)]"
                  fallbackClassName="text-2xl font-bold text-[#409CFF]"
                />

                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-white">
                    أهلاً بك، {profile?.nickname || user.email}!
                  </p>
                  <GenderBadge gender={profile?.gender} />
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <CountryBadge country={profile?.country} city={profile?.city} />
                {profile?.age && (
                  <span className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold text-[#E8D5B5]">
                    السن: {profile.age} سنة
                  </span>
                )}
              </div>

              {/* iOS 27 Quick Action Tiles */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  href="/discover"
                  className="group flex flex-col items-center justify-center rounded-[22px] border border-white/[0.10] bg-white/[0.05] p-4 transition-all duration-200 hover:border-[#0A84FF]/50 hover:bg-white/[0.10] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
                >
                  <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#0A84FF]/20 text-[#409CFF] border border-[#0A84FF]/30 transition-transform group-hover:scale-105">
                    <IconUsers size={22} />
                  </div>
                  <span className="text-sm font-bold text-white">الأعضاء</span>
                  <span className="mt-0.5 text-[11px] text-white/55">قائمة الأصدقاء</span>
                </Link>

                <Link
                  href="/rooms"
                  className="group flex flex-col items-center justify-center rounded-[22px] border border-white/[0.10] bg-white/[0.05] p-4 transition-all duration-200 hover:border-[#30D158]/50 hover:bg-white/[0.10] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
                >
                  <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30 transition-transform group-hover:scale-105">
                    <IconMessages size={22} />
                  </div>
                  <span className="text-sm font-bold text-white">الدردشة الجماعية</span>
                  <span className="mt-0.5 text-[11px] text-white/55">الشات المباشر</span>
                </Link>

                <Link
                  href="/messages"
                  className="group flex flex-col items-center justify-center rounded-[22px] border border-white/[0.10] bg-white/[0.05] p-4 transition-all duration-200 hover:border-[#5E5CE6]/50 hover:bg-white/[0.10] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
                >
                  <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#5E5CE6]/20 text-[#9F9DFF] border border-[#5E5CE6]/30 transition-transform group-hover:scale-105">
                    <IconDirectMessage size={22} />
                  </div>
                  <span className="text-sm font-bold text-white">الرسائل الخاصة</span>
                  <span className="mt-0.5 text-[11px] text-white/55">المحادثات الفردية</span>
                </Link>
              </div>

              <div className="mt-5 border-t border-white/[0.09] pt-4">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#409CFF] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
                >
                  عرض وتعديل ملفي الشخصي ←
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={`${buttonClassName({
                  variant: "primary",
                  size: "lg",
                })} w-full sm:w-auto font-bold`}
              >
                إنشاء حساب جديد
              </Link>
              <Link
                href="/login"
                className={`${buttonClassName({
                  variant: "subtle",
                  size: "lg",
                })} w-full sm:w-auto`}
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
