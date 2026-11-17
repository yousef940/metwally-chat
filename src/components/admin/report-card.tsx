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
    <div className="ios-card space-y-4 rounded-[24px] p-5 sm:p-6">
      {/* Top Header: Badge, Reason, and Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
              report.targetType === "user"
                ? "border-[#BF5AF2]/35 bg-[#BF5AF2]/15 text-[#DA8FFF]"
                : report.targetType === "message"
                ? "border-[#0A84FF]/35 bg-[#0A84FF]/15 text-[#64D2FF]"
                : "border-[#FF9F0A]/35 bg-[#FF9F0A]/15 text-[#FFD080]"
            }`}
          >
            {report.targetType === "user"
              ? "👤 بلاغ عن مستخدم"
              : report.targetType === "message"
              ? "💬 بلاغ عن رسالة"
              : "🏠 بلاغ عن غرفة"}
          </span>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              report.status === "pending"
                ? "border-[#FF453A]/35 bg-[#FF453A]/15 text-[#FF8982]"
                : report.status === "investigating"
                ? "border-[#FF9F0A]/35 bg-[#FF9F0A]/15 text-[#FFD080]"
                : report.status === "resolved"
                ? "border-[#30D158]/35 bg-[#30D158]/15 text-[#7AE897]"
                : "border-white/15 bg-white/[0.08] text-white/65"
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

        <span className="text-[11px] text-white/45">
          {new Date(report.createdAt).toLocaleString("ar-EG")}
        </span>
      </div>

      {/* Report Info */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-bold text-white/60">سبب البلاغ: </span>
          <span className="text-sm font-extrabold text-[#FF6961]">
            {report.reason}
          </span>
        </div>

        <div>
          <span className="font-bold text-white/60">المُبلِغ: </span>
          <span className="font-semibold text-white">{report.reporterNickname}</span>
        </div>

        {report.targetPreview && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3.5">
            <span className="mb-1 block font-bold text-white/60">
              الهدف المبلغ عنه:
            </span>
            <p className="font-semibold text-white">{report.targetPreview.title}</p>
            {report.targetPreview.content && (
              <p className="mt-1 italic text-white/80">
                &quot;{report.targetPreview.content}&quot;
              </p>
            )}
            {report.targetPreview.extra && (
              <p className="mt-1 text-[11px] text-white/45">
                {report.targetPreview.extra}
              </p>
            )}
          </div>
        )}

        {report.details && (
          <div>
            <span className="mb-1 block font-bold text-white/60">
              تفاصيل إضافية من المبلغ:
            </span>
            <p className="rounded-2xl border border-[#FF9F0A]/30 bg-[#FF9F0A]/12 p-3 text-white/85">
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
        {/* Status Transition buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {report.status !== "investigating" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("investigating")}
              className="rounded-full border border-[#FF9F0A]/35 bg-[#FF9F0A]/15 px-3.5 py-1.5 text-xs font-bold text-[#FFD080] transition-all hover:bg-[#FF9F0A]/25 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9F0A]"
            >
              قيد التحقيق
            </button>
          )}

          {report.status !== "resolved" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("resolved")}
              className="rounded-full border border-[#30D158]/35 bg-[#30D158]/15 px-3.5 py-1.5 text-xs font-bold text-[#7AE897] transition-all hover:bg-[#30D158]/25 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#30D158]"
            >
              ✓ تم الحل
            </button>
          )}

          {report.status !== "dismissed" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("dismissed")}
              className="ios-btn-glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/70 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
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
              className="rounded-full border border-[#FF453A]/35 bg-[#FF453A]/15 px-3.5 py-1.5 text-xs font-bold text-[#FF8982] transition-all hover:bg-[#FF453A]/25 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
            >
              🗑 حذف الرسالة
            </button>
          )}

          {report.targetType === "user" && (
            <button
              type="button"
              onClick={() => setShowBanModal(true)}
              className="rounded-full bg-[#FF453A] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#FF6961] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
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
