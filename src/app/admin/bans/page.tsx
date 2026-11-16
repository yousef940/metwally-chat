import { getBannedUsers } from "@/lib/actions/admin";
import { BannedUsersTable } from "@/components/admin/banned-users-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة الحسابات المحظورة - لوحة التحكم",
};

export default async function AdminBansPage() {
  const bans = await getBannedUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">سجل الحسابات المحظورة</h1>
        <p className="mt-1 text-xs sm:text-sm text-ink/70">
          عرض قائمة المستخدمين المحظورين نهائياً أو مؤقتاً، مع إمكانية إلغاء الحظر أو فرض حظر جديد.
        </p>
      </div>

      <BannedUsersTable initialBans={bans} />
    </div>
  );
}
