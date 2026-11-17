"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { respondToChatRequest } from "@/lib/actions/messages";
import { GenderBadge } from "@/components/profile/gender-badge";
import { Avatar } from "@/components/ui/avatar";

interface RequestItemProps {
  id: string;
  initialMessage: string;
  createdAt: string;
  isIncoming: boolean;
  user: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    gender: "male" | "female" | null;
    country?: string;
  };
}

export function RequestItem({
  id,
  initialMessage,
  createdAt,
  isIncoming,
  user,
}: RequestItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: "accept" | "decline") => {
    startTransition(async () => {
      const res = await respondToChatRequest(id, action);
      if (res.conversationId) {
        router.push(`/messages/${res.conversationId}`);
      } else {
        router.refresh();
      }
    });
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="ios-card flex flex-col gap-4 rounded-[24px] p-5 transition-all hover:border-white/[0.18]">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/profile/${user.id}`}
          className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
        >
          <Avatar
            src={user.avatar_url}
            name={user.nickname}
            size="md"
            frameClassName="border border-white/[0.14] bg-[#2C2C2E]"
            fallbackClassName="text-base font-bold text-white/60"
          />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white transition-colors group-hover:text-[#409CFF]">
                {user.nickname}
              </span>
              <GenderBadge gender={user.gender} showText={false} />
            </div>
            {user.country && (
              <span className="text-xs text-white/55">
                <span aria-hidden="true">📍</span> {user.country}
              </span>
            )}
          </div>
        </Link>

        <span className="whitespace-nowrap text-xs text-white/45">
          {formattedDate}
        </span>
      </div>

      {/* Message content */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3.5 text-sm leading-relaxed text-white/90">
        <p className="mb-1 text-xs font-semibold text-[#409CFF]">الرسالة التمهيدية:</p>
        <p className="whitespace-pre-line break-words">{initialMessage}</p>
      </div>

      {/* Actions */}
      {isIncoming ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("decline")}
            className="ios-btn-glass rounded-full px-4 py-2 text-xs font-semibold text-white/85 transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            رفض الطلب
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction("accept")}
            className="ios-btn-primary rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            {isPending ? "جاري القبول..." : "قبول وبدء المحادثة"}
          </button>
        </div>
      ) : (
        <p className="text-end text-xs font-medium text-[#FF9F0A]">
          <span aria-hidden="true">⏳</span> بانتظار رد الطرف الآخر...
        </p>
      )}
    </article>
  );
}
