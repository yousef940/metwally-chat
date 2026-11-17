import Link from "next/link";
import { getAdminReports } from "@/lib/actions/admin";
import { ReportCard } from "@/components/admin/report-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة البلاغات والشكاوى - لوحة التحكم",
};

interface ReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedParams = await searchParams;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "pending";

  const reports = await getAdminReports(status);

  const tabs = [
    { key: "pending", label: "بانتظار المراجعة" },
    { key: "investigating", label: "قيد التحقيق" },
    { key: "resolved", label: "تم الحل" },
    { key: "dismissed", label: "تم التجاهل" },
    { key: "all", label: "جميع البلاغات" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">إدارة البلاغات والشكاوى</h1>
        <p className="mt-1 text-xs sm:text-sm text-ink/70">
          مراجعة بلاغات الأعضاء، التحقق من الانتهاكات، واتخاذ إجراءات فورية بحظر المسيئين أو حذف الرسائل.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="تصفية البلاغات حسب الحالة"
        className="ios-segmented inline-flex flex-wrap gap-1 rounded-full p-1"
      >
        {tabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/reports?status=${tab.key}`}
              role="tab"
              aria-selected={isActive}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
                isActive
                  ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="ios-card rounded-[28px] p-12 text-center text-white/55">
          <span className="text-4xl block mb-2">🛡️</span>
          <p className="font-bold text-sm text-white">لا توجد بلاغات تطابق التصفية المحددة</p>
          <p className="text-xs text-white/45 mt-1">كل شيء هادئ ومنتظم.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
