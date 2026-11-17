import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { BackLink } from "@/components/ui/back-link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "تعديل الملف الشخصي - صحبة",
  description: "تعديل معلومات ملفك الشخصي في منصة صحبة",
};

export default async function ProfileEditPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 pb-28 md:pb-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">تعديل الملف الشخصي</h1>
          <p className="mt-1 text-sm text-white/60">
            حدّث صورتك الشخصية ومعلوماتك واهتماماتك
          </p>
        </div>
        <BackLink href="/profile" className="text-sm">
          العودة للملف الشخصي
        </BackLink>
      </div>

      <div className="ios-glass rounded-[30px] p-6 sm:p-8">
        <ProfileEditForm userId={user.id} profile={profile} />
      </div>
    </div>
  );
}
