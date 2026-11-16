"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { BlockButton } from "@/components/safety/block-button";
import { ReportModal } from "@/components/safety/report-modal";
import { Avatar } from "@/components/ui/avatar";
import {
  IconSend,
  IconHome,
  IconMessages,
  IconDirectMessage,
  IconUsers,
  IconSettings,
  IconSmile,
} from "@/components/ui/icons";
import {
  sendPrivateMessage,
  markConversationAsRead,
  toggleMuteConversation,
} from "@/lib/actions/messages";

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface PrivateChatProps {
  conversationId: string;
  currentUserId: string;
  currentUser?: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  };
  otherUser: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    gender: "male" | "female" | null;
    country?: string;
    city?: string;
  };
  initialMessages: PrivateMessage[];
  initialMuted: boolean;
}

export function PrivateChat({
  conversationId,
  currentUserId,
  currentUser,
  otherUser,
  initialMessages,
  initialMuted,
}: PrivateChatProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, startTransition] = useTransition();
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
    // Mark messages as read upon entering the conversation
    markConversationAsRead(conversationId);
  }, [conversationId]);

  // Realtime subscription for conversation messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as PrivateMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If incoming message, mark as read
          if (newMsg.sender_id !== currentUserId) {
            markConversationAsRead(conversationId);
          }

          setTimeout(() => scrollToBottom("smooth"), 50);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as PrivateMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setError(null);
    setInputText("");

    startTransition(async () => {
      const res = await sendPrivateMessage(conversationId, text);
      if (res.error) {
        setError(res.error);
        setInputText(text); // restore input
      } else {
        if (res.message) {
          const newMsg = res.message as PrivateMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom("smooth"), 50);
        }
        inputRef.current?.focus();
      }
    });
  };

  const handleToggleMute = async () => {
    const res = await toggleMuteConversation(conversationId);
    if (!res.error) {
      setIsMuted(res.isMuted);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0B1E24] text-[#FFF7EF] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#20454E] bg-[#0E252D] px-3 py-2.5 sm:px-6 sm:py-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink transition-colors hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            aria-label="العودة لصندوق الرسائل"
          >
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href={`/profile/${otherUser.id}`}
            className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <Avatar
              src={otherUser.avatar_url}
              name={otherUser.nickname}
              size="sm"
              fallbackClassName="font-bold text-ink/40"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink transition-colors group-hover:text-coral sm:text-base">
                  {otherUser.nickname}
                </span>
                <GenderBadge gender={otherUser.gender} showText={false} />
              </div>
              <div className="mt-0.5">
                <CountryBadge country={otherUser.country} city={otherUser.city} className="text-[11px] py-0.5 px-2" />
              </div>
            </div>
          </Link>
        </div>

        {/* Safety & Mute Options */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ReportModal
            targetType="user"
            targetId={otherUser.id}
            targetLabel={otherUser.nickname}
            triggerButtonText=""
            triggerLabel="الإبلاغ عن المستخدم"
            buttonClassName="rounded-xl border border-ink/15 bg-white p-2 text-xs text-ink/60 transition-colors hover:border-red-200 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          />

          <BlockButton
            targetUserId={otherUser.id}
            targetNickname={otherUser.nickname}
            buttonClassName="rounded-xl border border-ink/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          />

          <button
            type="button"
            onClick={handleToggleMute}
            aria-pressed={isMuted}
            title={isMuted ? "إلغاء كتم المحادثة" : "كتم الإشعارات"}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
              isMuted
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-ink/15 bg-white text-ink/70 hover:bg-ink/5"
            }`}
          >
            <span aria-hidden="true">{isMuted ? "🔕" : "🔔"}</span>{" "}
            {isMuted ? "مكتومة" : "كتم"}
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex flex-1 flex-col space-y-3.5 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="my-auto text-center text-sm text-ink/50">
            <div aria-hidden="true" className="mb-2 text-3xl">
              👋
            </div>
            <p>لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[70%] ${
                    isMe
                      ? // Own message: the bubble hugs the inline-end side.
                        "rounded-se-none bg-coral text-white"
                      : // Incoming message: the bubble hugs the inline-start side.
                        "rounded-ss-none border border-ink/10 bg-white text-ink"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Meta info: Time and Read Receipt */}
                <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-ink/50">
                  <span>{formatTime(msg.created_at)}</span>
                  {isMe && (
                    <span
                      title={msg.is_read ? "تمت القراءة" : "تم الإرسال"}
                      aria-label={msg.is_read ? "تمت القراءة" : "تم الإرسال"}
                      className={`font-mono text-xs font-bold ${
                        msg.is_read ? "text-coral" : "text-ink/40"
                      }`}
                    >
                      {msg.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between border-t border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="إغلاق رسالة الخطأ"
            className="ms-2 font-bold text-red-500 transition-colors hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* Input Bar - Substack Style */}
      <footer className="shrink-0 border-t border-[#20454E] bg-[#0E252D] p-2 sm:p-3 pb-safe">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-center gap-2">
          {/* User's Avatar */}
          <div className="shrink-0">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.nickname || "أنا"}
              size="sm"
              frameClassName="border border-[#20454E] bg-[#16353D]"
            />
          </div>

          {/* Substack-style Pill Input with Inner Circular Send Arrow */}
          <div className="relative flex flex-1 items-center rounded-full border border-[#20454E] bg-[#16353D] ps-3.5 pe-1.5 py-1 focus-within:border-coral focus-within:ring-1 focus-within:ring-coral transition-colors">
            <label htmlFor="private-message-input" className="sr-only">
              اكتب رسالة
            </label>
            <input
              id="private-message-input"
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              placeholder="اكتب رسالة..."
              maxLength={5000}
              className="flex-1 bg-transparent py-1.5 text-sm text-[#FFF7EF] placeholder:text-[#9CB3B8]/60 focus:outline-none min-w-0"
            />

            {/* Circular Send Arrow Inside Pill */}
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              aria-label="إرسال"
              className="inline-flex h-8 w-8 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm transition-all hover:bg-coral-hover active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
            >
              <IconSend size={15} />
            </button>
          </div>

          {/* Outer Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-[#9CB3B8] shrink-0">
            <button
              type="button"
              onClick={() => {
                setInputText((prev) => prev + " 😊");
                inputRef.current?.focus();
              }}
              title="رموز تعبيرية"
              aria-label="رموز تعبيرية"
              className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconSmile size={20} />
            </button>
          </div>
        </form>
      </footer>

      {/* Substack-style Bottom Navigation Bar */}
      <nav
        aria-label="شريط التنقل السفلي"
        className="shrink-0 border-t border-[#20454E]/70 bg-[#0A1B20] px-3 py-1 sm:py-1.5 pb-safe"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link
            href="/"
            title="الرئيسية"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconHome size={22} />
          </Link>

          <Link
            href="/rooms/main"
            title="الدردشة الجماعية"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconMessages size={22} />
          </Link>

          <Link
            href="/discover"
            title="الأعضاء"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconUsers size={22} />
          </Link>

          <Link
            href="/messages"
            title="الرسائل الخاصة"
            className="flex flex-col items-center justify-center p-2 text-coral transition-colors"
          >
            <IconDirectMessage size={22} className="text-coral" />
          </Link>

          <Link
            href="/settings"
            title="إعداداتي"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconSettings size={22} />
          </Link>
        </div>
      </nav>
    </div>
  );
}
