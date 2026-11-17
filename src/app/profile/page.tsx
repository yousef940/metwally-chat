import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/profile";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { Avatar } from "@/components/ui/avatar";
import { BackLink } from "@/components/ui/back-link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ملفي الشخصي - عيلة الحاج متولي",
  description: "عرض الملف الشخصي الخاص بك في عيلة الحاج متولي",
};

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 pb-28 md:pb-10">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackLink href="/" className="text-sm">
          العودة للرئيسية
        </BackLink>
        <Link
          href="/profile/edit"
          className="ios-btn-primary rounded-full px-4.5 py-2 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
        >
          تعديل الملف الشخصي
        </Link>
      </div>

      {/* Main iOS 27 Glass Profile Card */}
      <div className="ios-glass overflow-hidden rounded-[30px]">
        {/* Sculptural iOS 27 Cover Banner */}
        <div className="h-32 bg-gradient-to-br from-[#0A84FF]/35 via-[#2B2F3D]/70 to-[#E8D5B5]/25" />

        <div className="px-6 pb-8 pt-0 sm:px-8">
          {/* Avatar & Badges */}
          <div className="-mt-14 mb-4 flex flex-wrap items-end justify-between gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.nickname}
              size="2xl"
              frameClassName="border-4 border-[#1C1C1E] bg-[#2C2C2E] shadow-xl"
              fallbackClassName="text-4xl text-[#409CFF]"
              fallback="👤"
            />

            <div className="flex items-center gap-2">
              <GenderBadge gender={profile.gender} />
              {profile.age && (
                <span className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold text-[#E8D5B5]">
                  السن: {profile.age} سنة
                </span>
              )}
            </div>
          </div>

          {/* Name & Location */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              {profile.nickname}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <CountryBadge country={profile.country} city={profile.city} />
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 border-t border-white/[0.09] pt-5">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                نبذة شخصية
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6 border-t border-white/[0.09] pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">
                الاهتمامات
              </h2>
              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li
                    key={interest}
                    className="rounded-full border border-white/[0.10] bg-white/[0.06] px-3.5 py-1 text-xs font-medium text-white/90"
                  >
                    #{interest}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
