"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { BlockButton } from "@/components/safety/block-button";
import { ReportModal } from "@/components/safety/report-modal";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Avatar } from "@/components/ui/avatar";
import {
  IconSend,
  IconDirectMessage,
  IconSmile,
  IconBell,
  IconBellSlash,
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
            const tempIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp_") &&
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = newMsg;
              return updated;
            }
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

    // Instant 0ms Optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg: PrivateMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 10);

    startTransition(async () => {
      const res = await sendPrivateMessage(conversationId, text);
      if (res.error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(res.error);
        setInputText(text); // restore input
      } else {
        if (res.message) {
          const newMsg = res.message as PrivateMessage;
          setMessages((prev) => {
            const hasTemp = prev.some((m) => m.id === tempId);
            if (hasTemp) {
              return prev.map((m) => (m.id === tempId ? newMsg : m));
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
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
    <div className="fixed inset-0 flex h-[100dvh] w-full flex-col bg-black text-white overflow-hidden">
      {/* iOS 27 Liquid Glass Header — Permanently Fixed at Top */}
      <header className="ios-glass-bar flex items-center justify-between border-b px-3 py-2.5 sm:px-6 sm:py-3 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="ios-btn-glass flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            aria-label="العودة لصندوق الرسائل"
          >
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href={`/profile/${otherUser.id}`}
            className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            <Avatar
              src={otherUser.avatar_url}
              name={otherUser.nickname}
              size="sm"
              frameClassName="border border-white/15 bg-[#2C2C2E]"
              fallbackClassName="font-bold text-white/60"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white transition-colors group-hover:text-[#409CFF] sm:text-base">
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
            buttonClassName="ios-btn-glass rounded-full p-2 text-xs text-white/70 transition-all hover:border-[#FF453A]/50 hover:text-[#FF453A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          />

          <BlockButton
            targetUserId={otherUser.id}
            targetNickname={otherUser.nickname}
            buttonClassName="ios-btn-glass rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:border-[#FF453A]/50 hover:bg-[#FF453A]/15 hover:text-[#FF6961] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          />

          <button
            type="button"
            onClick={handleToggleMute}
            aria-pressed={isMuted}
            title={isMuted ? "إلغاء كتم المحادثة" : "كتم الإشعارات"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
              isMuted
                ? "border-[#FF9F0A]/40 bg-[#FF9F0A]/20 text-[#FFD080]"
                : "ios-btn-glass text-white/80"
            }`}
          >
            {isMuted ? <IconBellSlash size={14} /> : <IconBell size={14} />}
            <span>{isMuted ? "مكتومة" : "كتم"}</span>
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="ios-scroll flex flex-1 flex-col space-y-3 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="my-auto text-center text-sm text-white/55">
            <div className="ios-glass mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] text-[#409CFF]">
              <IconDirectMessage size={26} />
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
                  className={`no-callout max-w-[85%] break-words rounded-[22px] px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%] ${
                    isMe
                      ? "ios-bubble-me rounded-se-[6px]"
                      : "ios-bubble-other rounded-ss-[6px]"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Meta info: Time and Read Receipt */}
                <div className="mt-1 flex items-center gap-1.5 px-1.5 text-[11px] text-white/45">
                  <span>{formatTime(msg.created_at)}</span>
                  {isMe && (
                    <span
                      title={msg.is_read ? "تمت القراءة" : "تم الإرسال"}
                      aria-label={msg.is_read ? "تمت القراءة" : "تم الإرسال"}
                      className={`font-mono text-xs font-bold ${
                        msg.is_read ? "text-[#409CFF]" : "text-white/40"
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
          className="flex items-center justify-between border-t border-[#FF453A]/35 bg-[#2A1415] px-4 py-2.5 text-xs text-[#FF9B95]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="إغلاق رسالة الخطأ"
            className="ms-2 font-bold text-[#FF6961] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* iOS 27 Liquid Glass Composer Footer */}
      <footer className="ios-glass-bar shrink-0 border-t p-2.5 sm:p-3">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-center gap-2">
          {/* User's Avatar */}
          <div className="shrink-0">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.nickname || "أنا"}
              size="sm"
              frameClassName="border border-white/15 bg-[#2C2C2E]"
            />
          </div>

          {/* iOS 27 Liquid Glass Capsule Input with Inner Send Button */}
          <div className="relative flex flex-1 items-center rounded-full border border-white/[0.14] bg-[#26262A] ps-4 pe-1.5 py-1 focus-within:border-[#0A84FF] focus-within:ring-2 focus-within:ring-[#0A84FF]/25 transition-colors">
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
              placeholder="رسالة iMessage..."
              maxLength={5000}
              className="flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none min-w-0"
            />

            {/* Circular iOS Blue Send Button Inside Pill */}
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              aria-label="إرسال"
              className="ios-btn-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-25 disabled:pointer-events-none"
            >
              <IconSend size={15} />
            </button>
          </div>

          {/* Outer Icons */}
          <div className="flex items-center gap-1 text-white/60 shrink-0">
            <button
              type="button"
              onClick={() => {
                setInputText((prev) => prev + " 😊");
                inputRef.current?.focus();
              }}
              title="رموز تعبيرية"
              aria-label="رموز تعبيرية"
              className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <IconSmile size={20} />
            </button>
          </div>
        </form>
      </footer>

      {/* Same Unified Floating iOS 27 Bottom Tab Bar on Mobile */}
      <BottomNav inline />
    </div>
  );
}
