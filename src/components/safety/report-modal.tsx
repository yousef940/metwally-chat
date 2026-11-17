"use client";

import { useState, useTransition } from "react";
import { reportTarget } from "@/lib/actions/safety";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import {
  compactSelectClassName,
  compactTextareaClassName,
} from "@/components/ui/form-control";

interface ReportModalProps {
  targetType: "user" | "message" | "room";
  targetId: string;
  targetLabel?: string;
  triggerButtonText?: string;
  buttonClassName?: string;
  /** Accessible name of the trigger, required when the button shows an icon only. */
  triggerLabel?: string;
}

const REPORT_REASONS = [
  "تحرش أو ألفاظ غير لائقة",
  "احتيال مالي أو طلب رصيد / تحويل أموال",
  "ابتزاز أو تهديد",
  "انتحال شخصية أو حساب مزيف",
  "إرسال روابط مشبوهة أو أرقام هواتف بشكل متكرر",
  "محتوى غير لائق ومخالف لقواعد المنصة",
  "سبب آخر",
];

export function ReportModal({
  targetType,
  targetId,
  targetLabel,
  triggerButtonText = "إبلاغ",
  buttonClassName = "",
  triggerLabel,
}: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    setIsSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDetails("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || isPending) return;

    setError(null);
    startTransition(async () => {
      const res = await reportTarget(targetType, targetId, reason, details);
      if (res.error) {
        setError(res.error);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-ink/60 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
        }
        title="تقديم بلاغ لإدارة المنصة"
        aria-label={triggerLabel}
      >
        <span aria-hidden="true">🚩</span>
        {triggerButtonText && <span>{triggerButtonText}</span>}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="تقديم بلاغ رسمي"
        subtitle={
          targetLabel
            ? `بشأن: ${targetLabel}`
            : "سيتم مراجعة البلاغ من قِبل المشرفين"
        }
        icon={
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/15 text-lg"
          >
            🚩
          </span>
        }
        showCloseButton
        closeLabel="إغلاق نافذة البلاغ"
      >
        {isSuccess ? (
          <div className="py-8 text-center">
            <div
              aria-hidden="true"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#30D158]/30 bg-[#30D158]/15 text-3xl text-[#30D158]"
            >
              ✓
            </div>
            <h3 className="mt-3 text-base font-bold text-white">
              تم استلام بلاغك بنجاح
            </h3>
            <p className="mt-1 text-xs text-white/65">
              شكراً لمساهمتك في الحفاظ على أمان مجتمع صحبة. سنقوم بفحص الواقعة واتخاذ الإجراء اللازم.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <Alert tone="error" size="md" weight="semibold">
                {error}
              </Alert>
            )}

            <div>
              <label
                htmlFor="report-reason"
                className="mb-1.5 block text-xs font-bold text-white/85"
              >
                سبب البلاغ *
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={compactSelectClassName}
                required
              >
                {REPORT_REASONS.map((reportReason) => (
                  <option key={reportReason} value={reportReason}>
                    {reportReason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="report-details"
                className="mb-1.5 block text-xs font-bold text-white/85"
              >
                تفاصيل إضافية توضح المخالفة (اختياري)
              </label>
              <textarea
                id="report-details"
                rows={3}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="اكتب أي معلومات قد تفيد المشرفين في التحقيق..."
                className={compactTextareaClassName}
              />
              <div className="mt-1 text-end text-[10px] text-white/40">
                {details.length}/1000 حرف
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.10] pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="ios-btn-glass rounded-full px-4 py-2 text-xs font-semibold text-white/80 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-[#FF453A] px-5 py-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all hover:bg-[#FF6961] active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
              >
                {isPending ? "جاري الإرسال..." : "إرسال البلاغ"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
