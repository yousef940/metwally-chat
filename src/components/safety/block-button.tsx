"use client";

import { useState, useTransition } from "react";
import { blockUser, unblockUser } from "@/lib/actions/safety";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { IconBan, IconUnlock } from "@/components/ui/icons";

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
          `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
            isBlocked
              ? "border-[#30D158]/35 bg-[#30D158]/15 text-[#7AE897] hover:bg-[#30D158]/25"
              : "border-[#FF453A]/35 bg-[#FF453A]/15 text-[#FF8982] hover:bg-[#FF453A]/25"
          } disabled:opacity-50`
        }
      >
        {isBlocked ? <IconUnlock size={14} /> : <IconBan size={14} />}
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
          className="mt-3 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF453A]/30 bg-[#FF453A]/15 text-[#FF453A]"
        >
          <IconBan size={24} />
        </div>

        <p className="text-xs leading-relaxed text-white/70">
          عند تأكيد الحظر، لن يتمكن <strong className="text-white">{targetNickname}</strong> من إرسال رسائل إليك أو رؤية ملفك الشخصي، ولن تظهر رسائله في الغرف العامة أو المحادثات الخاصة.
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
            className="ios-btn-glass rounded-full px-4 py-2 text-xs font-semibold text-white/80 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={confirmBlock}
            disabled={isPending}
            className="rounded-full bg-[#FF453A] px-5 py-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all hover:bg-[#FF6961] active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
          >
            {isPending ? "جاري الحظر..." : "نعم، حظر المستخدم"}
          </button>
        </div>
      </Modal>
    </>
  );
}
