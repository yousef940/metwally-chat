import { getCurrentUserProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { SendRequestModal } from "@/components/messages/send-request-modal";
import { BlockButton } from "@/components/safety/block-button";
import { ReportModal } from "@/components/safety/report-modal";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/ui/app-footer";
import { Avatar } from "@/components/ui/avatar";
import { BackLink } from "@/components/ui/back-link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getCurrentUserProfile();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", id)
    .maybeSingle();

  return {
    title: profile?.nickname ? `ملف ${profile.nickname} - عيلة الحاج متولي` : "الملف الشخصي - عيلة الحاج متولي",
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile: currentUserProfile, supabase } = await getCurrentUserProfile();

  if (!user) {
    redirect(`/login?redirect=/profile/${id}`);
  }

  // If visiting own profile, redirect to /profile
  if (user.id === id) {
    redirect("/profile");
  }

  // Fetch target profile (RLS automatically filters if mutually blocked)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, bio, gender, intent, country, city, age, interests")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col justify-between text-white">
        <AppHeader user={user} profile={currentUserProfile} />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="ios-glass rounded-[30px] p-8">
            <span aria-hidden="true" className="text-4xl">
              🔒
            </span>
            <h1 className="mt-3 text-xl font-bold text-white">الملف الشخصي غير متاح</h1>
            <p className="mt-2 text-sm text-white/60">
              عذراً، هذا الحساب غير متاح أو لا يمكن عرضه بسبب قيود الخصوصية أو الحظر.
            </p>
            <div className="mt-6">
              <Link
                href="/discover"
                className="ios-btn-primary inline-flex rounded-full px-6 py-2.5 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                تصفح قائمة الأعضاء
              </Link>
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // Check if current user has blocked this target user
  const { data: blockRecord } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", id)
    .maybeSingle();

  const isInitiallyBlocked = Boolean(blockRecord);

  // Check existing conversation
  const p1 = user.id < id ? user.id : id;
  const p2 = user.id < id ? id : user.id;

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_one", p1)
    .eq("participant_two", p2)
    .maybeSingle();

  // Check existing chat request
  const { data: existingReq } = await supabase
    .from("chat_requests")
    .select("id, status, sender_id")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`
    )
    .maybeSingle();

  const isPending = existingReq?.status === "pending";

  return (
    <div className="flex min-h-screen flex-col justify-between text-white">
      <div>
        <AppHeader user={user} profile={currentUserProfile} />

        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 pb-28 md:pb-10">
          {/* Top Navigation Bar */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <BackLink href="/discover">
              العودة لقائمة الأعضاء
            </BackLink>

            <div className="flex items-center gap-2">
              <ReportModal
                targetType="user"
                targetId={profile.id}
                targetLabel={profile.nickname}
                triggerButtonText="إبلاغ"
                buttonClassName="ios-btn-glass rounded-full px-3.5 py-2 text-xs font-semibold text-white/75 transition-all hover:border-[#FF453A]/50 hover:text-[#FF453A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              />
              <BlockButton
                targetUserId={profile.id}
                targetNickname={profile.nickname}
                isInitiallyBlocked={isInitiallyBlocked}
              />
            </div>
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
                <div className="mt-6 border-t border-white/[0.09] pt-6">
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">نبذة تعريفية</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="mt-6 border-t border-white/[0.09] pt-6">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/50">
                    الاهتمامات والهوايات
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {profile.interests.map((interest: string) => (
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

              {/* Interaction Actions */}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-white/[0.09] pt-6">
                <SendRequestModal
                  receiverId={profile.id}
                  receiverNickname={profile.nickname}
                  hasExistingConversation={existingConv?.id}
                  hasPendingRequest={isPending}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
