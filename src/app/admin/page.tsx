import Link from "next/link";
import { getAdminStats, getAdminReports } from "@/lib/actions/admin";

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
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 text-xs font-bold mb-2">
            <span>إجمالي الأعضاء</span>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink">{stats.totalUsers}</p>
          <span className="text-[11px] text-ink/50 mt-1 block">حساب موثق</span>
        </div>

        {/* Pending Reports */}
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-700 text-xs font-bold mb-2">
            <span>بلاغات معلقة</span>
            <span className="text-lg">🚩</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-700">
            {stats.pendingReports}
          </p>
          <Link
            href="/admin/reports?status=pending"
            className="mt-1 block text-[11px] font-bold text-red-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            مراجعة الآن ←
          </Link>
        </div>

        {/* Active Bans */}
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 text-xs font-bold mb-2">
            <span>الحسابات المحظورة</span>
            <span className="text-lg">🚫</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink">{stats.activeBans}</p>
          <Link
            href="/admin/bans"
            className="mt-1 block text-[11px] font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            سجل الحظر ←
          </Link>
        </div>

        {/* Public Rooms */}
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink/50 text-xs font-bold mb-2">
            <span>الغرف العامة</span>
            <span className="text-lg">💬</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-ink">{stats.totalRooms}</p>
          <Link
            href="/admin/rooms"
            className="mt-1 block text-[11px] font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            إدارة الغرف ←
          </Link>
        </div>
      </div>

      {/* Recent Reports Overview */}
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-ink">
              أحدث البلاغات بانتظار الإجراء ({recentReports.length})
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              بلاغات واردة من المستخدمين حول انتهاكات محتملة لقواعد المجتمع
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink/80 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            عرض كافة البلاغات ←
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="py-12 text-center text-ink/50">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="font-bold text-sm">لا توجد بلاغات معلقة حالياً!</p>
            <p className="text-xs text-ink/40 mt-1">
              المجتمع آمن ولا توجد مخالفات جديدة مسجلة.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            {recentReports.slice(0, 5).map((report) => (
              <div key={report.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                      {report.targetType === "user"
                        ? "👤 مستخدم"
                        : report.targetType === "message"
                        ? "💬 رسالة"
                        : "🏠 غرفة"}
                    </span>
                    <span className="text-sm font-bold text-ink">{report.reason}</span>
                  </div>

                  <p className="text-xs text-ink/60 mt-1">
                    المُبلِغ: <strong>{report.reporterNickname}</strong> • الهدف:{" "}
                    <strong>{report.targetPreview?.title || report.targetId}</strong>
                  </p>

                  {report.details && (
                    <p className="text-xs text-ink/75 bg-cream/40 rounded-xl p-2.5 mt-2 line-clamp-1">
                      &quot;{report.details}&quot;
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={`/admin/reports?id=${report.id}`}
                    className="rounded-xl bg-coral px-4 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
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
