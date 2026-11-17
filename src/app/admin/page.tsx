import Link from "next/link";
import { getAdminStats, getAdminReports } from "@/lib/actions/admin";
import {
  IconUsers,
  IconFlag,
  IconBan,
  IconMessages,
  IconCheckSeal,
  IconUser,
  IconHome,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const recentReports = await getAdminReports("pending");

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl text-ink">
          لوحة الإشراف والإدارة
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-ink/70">
          متابعة أنشطة المجتمع، معالجة البلاغات، وفرض الأمان وحماية المستخدمين.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Users */}
        <div className="ios-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-white/55 text-xs font-bold mb-2">
            <span>إجمالي الأعضاء</span>
            <IconUsers size={18} className="text-[#409CFF]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalUsers}</p>
          <span className="text-[11px] text-white/45 mt-1 block">حساب موثق</span>
        </div>

        {/* Pending Reports */}
        <div className="rounded-[24px] border border-[#FF453A]/35 bg-[#FF453A]/12 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between text-[#FF8982] text-xs font-bold mb-2">
            <span>بلاغات معلقة</span>
            <IconFlag size={18} className="text-[#FF453A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#FF6961]">
            {stats.pendingReports}
          </p>
          <Link
            href="/admin/reports?status=pending"
            className="mt-1 block text-[11px] font-bold text-[#FF8982] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            مراجعة الآن ←
          </Link>
        </div>

        {/* Active Bans */}
        <div className="ios-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-white/55 text-xs font-bold mb-2">
            <span>الحسابات المحظورة</span>
            <IconBan size={18} className="text-[#FF9F0A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.activeBans}</p>
          <Link
            href="/admin/bans"
            className="mt-1 block text-[11px] font-semibold text-[#409CFF] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            سجل الحظر ←
          </Link>
        </div>

        {/* Public Rooms */}
        <div className="ios-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-white/55 text-xs font-bold mb-2">
            <span>الغرف العامة</span>
            <IconMessages size={18} className="text-[#30D158]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalRooms}</p>
          <Link
            href="/admin/rooms"
            className="mt-1 block text-[11px] font-semibold text-[#409CFF] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            إدارة الغرف ←
          </Link>
        </div>
      </div>

      {/* Recent Reports Overview */}
      <div className="ios-glass rounded-[28px] p-6">
        <div className="flex items-center justify-between border-b border-white/[0.10] pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              أحدث البلاغات بانتظار الإجراء ({recentReports.length})
            </h2>
            <p className="text-xs text-white/55 mt-0.5">
              بلاغات واردة من المستخدمين حول انتهاكات محتملة لقواعد المجتمع
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="ios-btn-glass rounded-full px-3.5 py-1.5 text-xs font-bold text-white/85 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            عرض كافة البلاغات ←
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="py-12 text-center text-white/55">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#30D158]/30 bg-[#30D158]/15 text-[#30D158]">
              <IconCheckSeal size={28} />
            </div>
            <p className="font-bold text-sm text-white">لا توجد بلاغات معلقة حالياً!</p>
            <p className="text-xs text-white/45 mt-1">
              المجتمع آمن ولا توجد مخالفات جديدة مسجلة.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {recentReports.slice(0, 5).map((report) => (
              <div key={report.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#FF453A]/35 bg-[#FF453A]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FF8982]">
                      {report.targetType === "user" ? (
                        <>
                          <IconUser size={12} />
                          <span>مستخدم</span>
                        </>
                      ) : report.targetType === "message" ? (
                        <>
                          <IconMessages size={12} />
                          <span>رسالة</span>
                        </>
                      ) : (
                        <>
                          <IconHome size={12} />
                          <span>غرفة</span>
                        </>
                      )}
                    </span>
                    <span className="text-sm font-bold text-white">{report.reason}</span>
                  </div>

                  <p className="text-xs text-white/60 mt-1">
                    المُبلِغ: <strong className="text-white/90">{report.reporterNickname}</strong> • الهدف:{" "}
                    <strong className="text-white/90">{report.targetPreview?.title || report.targetId}</strong>
                  </p>

                  {report.details && (
                    <p className="text-xs text-white/75 bg-white/[0.05] border border-white/[0.08] rounded-xl p-2.5 mt-2 line-clamp-1">
                      &quot;{report.details}&quot;
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={`/admin/reports?id=${report.id}`}
                    className="ios-btn-primary rounded-full px-4 py-2 text-center text-xs font-bold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                  >
                    فحص واتخاذ إجراء
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
