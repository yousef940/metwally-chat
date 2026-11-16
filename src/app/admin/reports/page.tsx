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
        className="flex flex-wrap gap-2 border-b border-ink/10 pb-3"
      >
        {tabs.map((tab) => {
          const isActive = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/reports?status=${tab.key}`}
              role="tab"
              aria-selected={isActive}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
                isActive
                  ? "bg-coral text-white shadow-xs"
                  : "border border-ink/10 bg-white text-ink/70 hover:bg-cream"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-ink/50 shadow-xs">
          <span className="text-4xl block mb-2">🛡️</span>
          <p className="font-bold text-sm">لا توجد بلاغات تطابق التصفية المحددة</p>
          <p className="text-xs text-ink/40 mt-1">كل شيء هادئ ومنتظم.</p>
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
