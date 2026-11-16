"use client";

import { useState, useTransition } from "react";
import { blockUser, unblockUser } from "@/lib/actions/safety";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";

interface BlockButtonProps {
  targetUserId: string;
  targetNickname: string;
  isInitiallyBlocked?: boolean;
  buttonClassName?: string;
  onBlockChanged?: (blocked: boolean) => void;
}

/**
 * Block/Unblock toggle button with confirmation dialog.
 * Mutual privacy guarantee: blocking hides messages and profiles in both directions.
 */
export function BlockButton({
  targetUserId,
  targetNickname,
  isInitiallyBlocked = false,
  buttonClassName = "",
  onBlockChanged,
}: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(isInitiallyBlocked);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isBlocked) {
      startTransition(async () => {
        const res = await unblockUser(targetUserId);
        if (res.error) {
          setError(res.error);
        } else {
          setIsBlocked(false);
          onBlockChanged?.(false);
        }
      });
    } else {
      // Show confirmation dialog before blocking
      setShowConfirm(true);
    }
  };

  const confirmBlock = () => {
    setError(null);
    startTransition(async () => {
      const res = await blockUser(targetUserId);
      if (res.error) {
        setError(res.error);
      } else {
        setIsBlocked(true);
        setShowConfirm(false);
        onBlockChanged?.(true);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={
          buttonClassName ||
          `inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
            isBlocked
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100"
          } disabled:opacity-50`
        }
      >
        <span aria-hidden="true">{isBlocked ? "🔓" : "🚫"}</span>
        <span>
          {isPending
            ? "جاري المعالجة..."
            : isBlocked
            ? "إلغاء الحظر"
            : "حظر المستخدم"}
        </span>
      </button>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={`تأكيد حظر ${targetNickname}`}
        panelClassName="max-w-sm"
      >
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-600"
        >
          🚫
        </div>

        <p className="text-xs leading-relaxed text-ink/70">
          عند تأكيد الحظر، لن يتمكن <strong>{targetNickname}</strong> من إرسال رسائل إليك أو رؤية ملفك الشخصي، ولن تظهر رسائله في الغرف العامة أو المحادثات الخاصة.
        </p>

        {error && (
          <div className="mt-3">
            <Alert tone="error" size="sm" weight="normal">
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={confirmBlock}
            disabled={isPending}
            className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            {isPending ? "جاري الحظر..." : "نعم، حظر المستخدم"}
          </button>
        </div>
      </Modal>
    </>
  );
}
