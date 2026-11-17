import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { getBlockedUsers } from "@/lib/actions/safety";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/ui/app-footer";
import { Avatar } from "@/components/ui/avatar";
import { IconUser } from "@/components/ui/icons";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { BlockedUsersList } from "@/components/safety/blocked-users-list";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { DeleteAccountButton } from "@/components/auth/delete-account-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الملف الشخصي والإعدادات - عائلة الحاج متولي",
  description: "عرض وتعديل ملفك الشخصي وإدارة إعدادات الأمان والخصوصية في صفحة واحدة",
};

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const blockedUsers = await getBlockedUsers();

  const accountIdentifier =
    user.email?.endsWith("@sohba.local") || user.email?.endsWith("@sohba.internal")
      ? profile.nickname
      : user.email;

  return (
    <div className="min-h-screen text-white flex flex-col justify-between">
      <div>
        <AppHeader user={user} profile={profile} />

        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 pb-36 md:pb-14">
          {/* Page Header */}
          <div className="mb-7">
            <h1 className="text-3xl font-black tracking-tight text-white">
              ملفي الشخصي والإعدادات
            </h1>
            <p className="mt-1 text-sm text-white/60">
              عدّل بياناتك وصورتك الشخصية وتحكّم في الأمان والخصوصية من مكان واحد
            </p>
          </div>

          <div className="space-y-6">
            {/* Unified Profile Preview + Direct Edit Card */}
            <div className="ios-glass rounded-[30px]">
              {/* Sculptural iOS 27 Cover Banner */}
              <div className="h-24 rounded-t-[29px] bg-gradient-to-br from-[#0A84FF]/35 via-[#2B2F3D]/70 to-[#E8D5B5]/25" />

              <div className="px-5 pb-6 pt-0 sm:px-7">
                {/* Summary Header */}
                <div className="-mt-11 mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.09] pb-5">
                  <div className="flex items-end gap-3.5">
                    <Avatar
                      src={profile.avatar_url}
                      name={profile.nickname}
                      size="xl"
                      frameClassName="border-4 border-[#1C1C1E] bg-[#2C2C2E] shadow-xl"
                      fallbackClassName="text-3xl font-bold text-[#409CFF]"
                      fallback={<IconUser size={44} className="text-white/45" />}
                    />
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-white">
                          {profile.nickname}
                        </h2>
                        <GenderBadge gender={profile.gender} />
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">
                        معرّف الحساب: {accountIdentifier}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CountryBadge country={profile.country} city={profile.city} />
                    {profile.age && (
                      <span className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold text-[#E8D5B5]">
                        {profile.age} سنة
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form with Always-Visible Save Button */}
                <ProfileEditForm userId={user.id} profile={profile} />
              </div>
            </div>

            {/* Blocked Users Section */}
            <div className="ios-card rounded-[26px] p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">
                  قائمة الحظر ({blockedUsers.length})
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  المستخدمون المحظورون لا يمكنهم رؤية ملفك الشخصي أو إرسال رسائل إليك، ولن تظهر رسائلهم لك.
                </p>
              </div>
              <BlockedUsersList initialUsers={blockedUsers} />
            </div>

            {/* Change password card */}
            <div className="ios-card rounded-[26px] p-6">
              <h2 className="text-lg font-bold text-white mb-4">تغيير كلمة المرور</h2>
              <ResetPasswordForm />
            </div>

            {/* Danger zone / Account deletion card */}
            <div className="ios-card rounded-[26px] border-[#FF453A]/35 p-6">
              <h2 className="text-lg font-bold text-[#FF453A]">منطقة الحظر والحذف</h2>
              <p className="mt-1 text-sm text-white/60 mb-4">
                يمكنك حذف حسابك وجميع بياناتك نهائياً من عائلة الحاج متولي في أي وقت.
              </p>
              <DeleteAccountButton />
            </div>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
