import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/profile";
import { getBlockedUsers } from "@/lib/actions/safety";
import { DeleteAccountButton } from "@/components/auth/delete-account-button";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { BlockedUsersList } from "@/components/safety/blocked-users-list";
import { Avatar } from "@/components/ui/avatar";
import { IconCamera } from "@/components/ui/icons";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/ui/app-footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إعدادات الحساب - متولي شات",
  description: "إدارة إعدادات حسابك في متولي شات",
};

export default async function SettingsPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  const blockedUsers = await getBlockedUsers();

  return (
    <div className="min-h-screen text-white flex flex-col justify-between">
      <div>
        <AppHeader user={user} profile={profile} />

        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 pb-28 md:pb-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-white">إعدادات الحساب والأمان</h1>
            <p className="mt-1 text-sm text-white/60">
              إدارة خصوصية حسابك، قائمة الحظر، وبياناتك الشخصية
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile overview card */}
            <div className="ios-glass rounded-[26px] p-6">
              <div className="flex items-center justify-between border-b border-white/[0.10] pb-4">
                <h2 className="text-lg font-bold text-white">بيانات الحساب الأساسية</h2>
                <Link
                  href="/profile/edit"
                  className="ios-btn-glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#409CFF] transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  تعديل الملف الشخصي
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-white/[0.10] py-4">
                <div className="relative group shrink-0">
                  <Avatar
                    src={profile?.avatar_url}
                    name={profile?.nickname || "مستخدم"}
                    size="lg"
                    frameClassName="border-2 border-white/25 bg-[#2C2C2E] shadow-md"
                    fallbackClassName="text-xl font-bold text-[#409CFF]"
                  />
                  <Link
                    href="/profile/edit"
                    className="ios-btn-primary absolute -bottom-1 -end-1 rounded-full p-1.5 text-white transition-transform hover:scale-110"
                    title="تغيير الصورة الشخصية"
                  >
                    <IconCamera size={14} />
                  </Link>
                </div>
                <div className="text-center sm:text-start flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-lg font-bold text-white">{profile?.nickname}</h3>
                    <GenderBadge gender={profile?.gender} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <CountryBadge country={profile?.country} city={profile?.city} />
                    {profile?.age && (
                      <span className="rounded-full border border-white/[0.10] bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-[#E8D5B5]">
                        {profile.age} سنة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-white/50 text-xs">معرّف الحساب:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {user.email?.endsWith("@sohba.local") || user.email?.endsWith("@sohba.internal")
                      ? profile?.nickname
                      : user.email}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">الاسم المستعار:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {profile?.nickname || "لم يحدد بعد"}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">الجنس والنوع:</span>
                  <div className="mt-1">
                    <GenderBadge gender={profile?.gender} />
                  </div>
                </div>
                <div>
                  <span className="text-white/50 text-xs">العمر:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {profile?.age ? `${profile.age} سنة` : "غير محدد"}
                  </p>
                </div>
                <div>
                  <span className="text-white/50 text-xs">الدولة والمدينة:</span>
                  <div className="mt-1">
                    <CountryBadge country={profile?.country} city={profile?.city} />
                  </div>
                </div>
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
