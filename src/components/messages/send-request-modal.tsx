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
        className="ios-btn-primary inline-flex items-center gap-1.5 justify-center rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
      >
        <IconDirectMessage size={14} />
        <span>متابعة المحادثة</span>
      </button>
    );
  }

  // If request is already pending
  if (hasPendingRequest) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#FF9F0A]/35 bg-[#FF9F0A]/15 px-3.5 py-2 text-xs font-semibold text-[#FFD080]">
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
        className="ios-btn-primary inline-flex items-center gap-1.5 justify-center rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
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
          <div className="space-y-4 py-3 text-center">
            <Alert tone="success">
              تم إرسال طلب المحادثة إلى <strong>{receiverNickname}</strong> بنجاح!
            </Alert>
            <p className="text-xs text-white/65">
              سيتم إشعارك فور قبول الطرف الآخر للطلب للبدء في تبادل الرسائل المباشرة.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="ios-btn-primary rounded-full px-6 py-2.5 text-xs font-bold active:scale-95"
              >
                حسناً
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <p className="text-xs text-white/65 leading-relaxed">
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
                className="mb-1.5 block text-xs font-semibold text-white"
              >
                رسالتك التمهيدية <span className="text-[#0A84FF]">*</span>
              </label>
              <textarea
                id="req-message"
                rows={4}
                required
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`مرحباً ${receiverNickname}...`}
                className="w-full rounded-2xl border border-white/[0.12] bg-[#2C2C2E]/80 p-3.5 text-sm text-white transition-all placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25"
              />
              <div className="mt-1 text-end text-[11px] text-white/45">
                {message.length} / 1000
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="ios-btn-glass rounded-full px-4 py-2.5 text-xs font-semibold active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isPending || !message.trim()}
                className="ios-btn-primary rounded-full px-6 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
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
