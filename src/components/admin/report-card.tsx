"use client";

import { useState, useTransition } from "react";
import {
  updateReportStatus,
  banUser,
  deleteReportedMessage,
  type EnrichedReport,
} from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import {
  compactSelectClassName,
  compactTextareaClassName,
} from "@/components/ui/form-control";

interface ReportCardProps {
  report: EnrichedReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ban Dialog State
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState(
    `مخالفة لقواعد المجتمع بناء على بلاغ #${report.id.slice(0, 6)}: ${report.reason}`
  );
  const [banDays, setBanDays] = useState<number | 0>(7); // 0 = permanent

  const handleStatusChange = (
    status: "pending" | "investigating" | "resolved" | "dismissed"
  ) => {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateReportStatus(report.id, status);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg("تم تحديث حالة البلاغ بنجاح.");
      }
    });
  };

  const handleDeleteMsg = () => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة نهائياً؟")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteReportedMessage("room", report.targetId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg("تم حذف الرسالة المبلغ عنها.");
        // Also mark report as resolved
        await updateReportStatus(report.id, "resolved");
      }
    });
  };

  const handleBanUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const targetUserId = report.targetType === "user" ? report.targetId : "";
      if (!targetUserId) return;

      const duration = banDays > 0 ? banDays : null;
      const res = await banUser(targetUserId, banReason, duration);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          `تم حظر المستخدم ${duration ? `لمدة ${duration} يوم` : "نهائياً"}.`
        );
        setShowBanModal(false);
        // Automatically resolve report
        await updateReportStatus(report.id, "resolved");
      }
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-xs sm:p-6">
      {/* Top Header: Badge, Reason, and Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/5 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
              report.targetType === "user"
                ? "bg-purple-100 text-purple-800"
                : report.targetType === "message"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {report.targetType === "user"
              ? "👤 بلاغ عن مستخدم"
              : report.targetType === "message"
              ? "💬 بلاغ عن رسالة"
              : "🏠 بلاغ عن غرفة"}
          </span>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              report.status === "pending"
                ? "bg-red-100 text-red-700"
                : report.status === "investigating"
                ? "bg-amber-100 text-amber-700"
                : report.status === "resolved"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {report.status === "pending"
              ? "بانتظار المراجعة"
              : report.status === "investigating"
              ? "قيد التحقيق"
              : report.status === "resolved"
              ? "تم الحل"
              : "تم التجاهل"}
          </span>
        </div>

        <span className="text-[11px] text-ink/50">
          {new Date(report.createdAt).toLocaleString("ar-EG")}
        </span>
      </div>

      {/* Report Info */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-bold text-ink/70">سبب البلاغ: </span>
          <span className="text-sm font-extrabold text-red-600">
            {report.reason}
          </span>
        </div>

        <div>
          <span className="font-bold text-ink/70">المُبلِغ: </span>
          <span className="font-semibold text-ink">{report.reporterNickname}</span>
        </div>

        {report.targetPreview && (
          <div className="rounded-xl border border-ink/5 bg-[#F8F9FA] p-3">
            <span className="mb-1 block font-bold text-ink/70">
              الهدف المبلغ عنه:
            </span>
            <p className="font-semibold text-ink">{report.targetPreview.title}</p>
            {report.targetPreview.content && (
              <p className="mt-1 italic text-ink/80">
                &quot;{report.targetPreview.content}&quot;
              </p>
            )}
            {report.targetPreview.extra && (
              <p className="mt-1 text-[11px] text-ink/50">
                {report.targetPreview.extra}
              </p>
            )}
          </div>
        )}

        {report.details && (
          <div>
            <span className="mb-1 block font-bold text-ink/70">
              تفاصيل إضافية من المبلغ:
            </span>
            <p className="rounded-xl border border-amber-200/50 bg-amber-50/60 p-2.5 text-ink/80">
              {report.details}
            </p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert tone="error" size="sm" weight="normal">
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert tone="success" size="sm" weight="normal">
          {successMsg}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3">
        {/* Status Transition buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {report.status !== "investigating" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("investigating")}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              قيد التحقيق
            </button>
          )}

          {report.status !== "resolved" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("resolved")}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              ✓ تم الحل
            </button>
          )}

          {report.status !== "dismissed" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("dismissed")}
              className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:bg-cream disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              تجاهل
            </button>
          )}
        </div>

        {/* Severe Punitive Actions */}
        <div className="flex items-center gap-2">
          {report.targetType === "message" && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleDeleteMsg}
              className="rounded-xl border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              🗑 حذف الرسالة
            </button>
          )}

          {report.targetType === "user" && (
            <button
              type="button"
              onClick={() => setShowBanModal(true)}
              className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              🚫 حظر الحساب
            </button>
          )}
        </div>
      </div>

      {/* Ban User Dialog */}
      <Modal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        title="حظر المستخدم المبلغ عنه"
        titleClassName="flex items-center gap-2 text-base font-bold text-red-600"
        icon={
          <span aria-hidden="true" className="text-base">
            🚫
          </span>
        }
        subtitle="سيتم منع المستخدم من تسجيل الدخول والمشاركة في المحادثات والغرف."
      >
        <form onSubmit={handleBanUserSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor={`ban-duration-${report.id}`}
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              مدة الحظر
            </label>
            <select
              id={`ban-duration-${report.id}`}
              value={banDays}
              onChange={(e) => setBanDays(Number(e.target.value))}
              className={compactSelectClassName}
            >
              <option value={1}>يوم واحد (24 ساعة)</option>
              <option value={3}>3 أيام</option>
              <option value={7}>أسبوع واحد (7 أيام)</option>
              <option value={30}>شهر واحد (30 يوماً)</option>
              <option value={0}>حظر دائم نهائياً</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`ban-reason-${report.id}`}
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              سبب الحظر المسجل
            </label>
            <textarea
              id={`ban-reason-${report.id}`}
              rows={2}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className={compactTextareaClassName}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-2">
            <button
              type="button"
              onClick={() => setShowBanModal(false)}
              className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-red-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {isPending ? "جاري الحظر..." : "تأكيد الحظر"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
