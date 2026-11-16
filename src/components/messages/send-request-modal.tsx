"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendChatRequest } from "@/lib/actions/messages";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { IconDirectMessage } from "@/components/ui/icons";

interface SendRequestModalProps {
  receiverId: string;
  receiverNickname: string;
  hasExistingConversation?: string | null;
  hasPendingRequest?: boolean;
}

export function SendRequestModal({
  receiverId,
  receiverNickname,
  hasExistingConversation,
  hasPendingRequest = false,
}: SendRequestModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already chatting, directly jump to the conversation
  if (hasExistingConversation) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/messages/${hasExistingConversation}`)}
        className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      >
        <IconDirectMessage size={14} />
        <span>متابعة المحادثة</span>
      </button>
    );
  }

  // If request is already pending
  if (hasPendingRequest) {
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
        <span>طلب معلق</span>
      </span>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isPending) return;

    setError(null);
    startTransition(async () => {
      const res = await sendChatRequest(receiverId, message);
      if (res.error) {
        setError(res.error);
      } else if (res.conversationId) {
        router.push(`/messages/${res.conversationId}`);
      } else {
        setSuccess(true);
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setSuccess(false);
    setMessage("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      >
        <IconDirectMessage size={14} />
        <span>محادثة خاصة</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`بدء محادثة خاصة مع ${receiverNickname}`}
      >
        {success ? (
          <div className="space-y-4 py-2 text-center">
            <Alert tone="success">
              تم إرسال طلب المحادثة إلى <strong>{receiverNickname}</strong> بنجاح!
            </Alert>
            <p className="text-xs text-ink/70">
              سيتم إشعارك فور قبول الطرف الآخر للطلب للبدء في تبادل الرسائل المباشرة.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-coral px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-coral-hover"
              >
                حسناً
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-ink/70 leading-relaxed">
              أرسل رسالة ترحيبية لـ <strong>{receiverNickname}</strong> لبدء المحادثة بينكما.
            </p>

            {error && (
              <Alert tone="error">
                {error}
              </Alert>
            )}

            <div>
              <label
                htmlFor="req-message"
                className="mb-1 block text-xs font-semibold text-ink"
              >
                رسالتك التمهيدية <span className="text-coral">*</span>
              </label>
              <textarea
                id="req-message"
                rows={4}
                required
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`مرحباً ${receiverNickname}...`}
                className="w-full rounded-2xl border border-ink/20 p-3 text-sm text-ink transition-colors placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              />
              <div className="mt-1 text-end text-[11px] text-ink/50">
                {message.length} / 1000
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-xl border border-ink/20 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isPending || !message.trim()}
                className="rounded-xl bg-coral px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                {isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
