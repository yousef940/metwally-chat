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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 pb-24 md:pb-8">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackLink href="/" className="text-sm">
          العودة للرئيسية
        </BackLink>
        <Link
          href="/profile/edit"
          className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-coral"
        >
          تعديل الملف الشخصي
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="overflow-hidden rounded-3xl border border-[#20454E] bg-[#122A31] shadow-lg">
        {/* Cover / Header Banner */}
        <div className="h-28 bg-gradient-to-r from-coral/25 via-[#16353D] to-coral/15" />

        <div className="px-6 pb-8 pt-0 sm:px-8">
          {/* Avatar & Badges */}
          <div className="-mt-14 mb-4 flex flex-wrap items-end justify-between gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.nickname}
              size="2xl"
              frameClassName="border-4 border-[#122A31] bg-[#16353D] shadow-md"
              fallbackClassName="text-4xl text-coral"
              fallback="👤"
            />

            <div className="flex items-center gap-2">
              <GenderBadge gender={profile.gender} />
              {profile.age && (
                <span className="rounded-lg border border-[#20454E] bg-[#16353D] px-3 py-1 text-xs font-bold text-coral">
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
            <div className="mt-6 border-t border-[#20454E] pt-5">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9CB3B8]">
                نبذة شخصية
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6 border-t border-[#20454E] pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9CB3B8]">
                الاهتمامات
              </h2>
              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li
                    key={interest}
                    className="rounded-xl border border-[#20454E] bg-[#0E252D] px-3 py-1 text-xs font-medium text-white/90"
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
