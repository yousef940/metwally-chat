"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GenderBadge } from "@/components/profile/gender-badge";
import { ReportModal } from "@/components/safety/report-modal";
import { Avatar } from "@/components/ui/avatar";
import {
  IconSend,
  IconClose,
  IconReply,
  IconCopy,
  IconMessages,
  IconUsers,
  IconHome,
  IconDirectMessage,
  IconImage,
  IconSmile,
  IconSettings,
} from "@/components/ui/icons";
import { sendRoomMessage, deleteRoomMessage } from "@/lib/actions/rooms";
import { toggleRoomMessageReaction, pinRoomMessage } from "@/lib/actions/reactions";
import { compressImage } from "@/lib/image-compressor";
import { Lightbox } from "@/components/ui/lightbox";
import type { Profile } from "@/lib/profile";
import type { ChatMessage, ChatProfile, ChatMessageReaction, Room } from "@/components/rooms/types";

function renderMessageTextWithMentions(text: string, currentNickname: string) {
  const parts = text.split(/(@[\w\u0600-\u06FF]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const name = part.slice(1);
      const isMe = name.toLowerCase() === currentNickname.toLowerCase();
      return (
        <span
          key={index}
          className={`inline-block font-bold rounded-lg px-1.5 py-0.5 mx-0.5 transition-all ${
            isMe
              ? "bg-coral/30 text-white ring-1 ring-coral font-black shadow-sm"
              : "bg-coral/15 text-coral"
          }`}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function parseMessageContent(text: string) {
  let content = text;
  let hasQuote = false;
  let quoteAuthor = "";
  let quoteText = "";

  if (content.startsWith("> ")) {
    const newlineIndex = content.indexOf("\n");
    if (newlineIndex > -1) {
      const quoteLine = content.slice(2, newlineIndex);
      const colonIndex = quoteLine.indexOf(": ");
      quoteAuthor = colonIndex > -1 ? quoteLine.slice(0, colonIndex) : "";
      quoteText = colonIndex > -1 ? quoteLine.slice(colonIndex + 2) : quoteLine;
      content = content.slice(newlineIndex + 1);
      hasQuote = true;
    }
  }

  // Detect image tag: [image:URL]
  let imageUrl: string | null = null;
  const imageMatch = content.match(/\[image:(https?:\/\/[^\]\s]+)\]/);
  if (imageMatch) {
    imageUrl = imageMatch[1];
    content = content.replace(imageMatch[0], "").trim();
  }

  return {
    hasQuote,
    quoteAuthor,
    quoteText,
    imageUrl,
    message: content,
  };
}

interface PresenceUser {
  user_id: string;
  nickname: string;
  avatar_url?: string | null;
  gender?: "male" | "female" | null;
}

interface RoomChatProps {
  room: Room;
  currentUser: {
    id: string;
    email?: string;
  };
  currentProfile: Profile;
  initialMessages: ChatMessage[];
}

export function RoomChat({
  room,
  currentUser,
  currentProfile,
  initialMessages,
}: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    author: string;
    text: string;
  } | null>(null);
  const [isSending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    { nickname: string; avatar_url?: string | null; userId: string }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(
    room.pinned_message_id || null
  );
  const [reactionsMap, setReactionsMap] = useState<Record<string, ChatMessageReaction[]>>({});
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const isAdmin = currentProfile.role === "admin";
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessage | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Profile cache to map user_id -> profile
  const profileCache = useRef<Record<string, ChatProfile | undefined>>({});

  // Seed cache with initial messages profiles and current profile
  useEffect(() => {
    profileCache.current[currentUser.id] = {
      id: currentUser.id,
      nickname: currentProfile.nickname,
      avatar_url: currentProfile.avatar_url,
      gender: currentProfile.gender,
    };
    initialMessages.forEach((message) => {
      if (message.profile) {
        profileCache.current[message.user_id] = message.profile;
      }
    });
  }, [currentUser.id, currentProfile, initialMessages]);

  // Scroll to bottom on new messages
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  // Supabase Realtime & Presence setup
  useEffect(() => {
    const supabase = createClient();

    // 1. Messages Realtime Channel
    const messageChannel = supabase
      .channel(`room_messages:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;

          // Check if sender profile is already cached
          let senderProfile = profileCache.current[newMsg.user_id];
          if (!senderProfile) {
            const { data } = await supabase
              .from("profiles")
              .select("id, nickname, avatar_url, gender")
              .eq("id", newMsg.user_id)
              .maybeSingle();

            if (data) {
              senderProfile = data as ChatProfile;
              profileCache.current[newMsg.user_id] = senderProfile;
            }
          }

          setMessages((prev) => {
            // Check if there is an optimistic message waiting for this real message
            const tempIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp_") &&
                m.user_id === newMsg.user_id &&
                m.content === newMsg.content
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = {
                ...newMsg,
                profile: senderProfile || updated[tempIndex].profile,
              };
              return updated;
            }
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, profile: senderProfile }];
          });

          setTimeout(() => scrollToBottom("smooth"), 50);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as {
          nickname?: string;
          avatar_url?: string | null;
          userId?: string;
        };
        if (!data || data.userId === currentUser.id || !data.nickname) return;
        const typingUser = {
          nickname: data.nickname,
          avatar_url: data.avatar_url,
          userId: data.userId || data.nickname,
        };
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === typingUser.userId)) return prev;
          return [...prev, typingUser];
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== typingUser.userId));
        }, 3500);
      })
      .subscribe();

    channelRef.current = messageChannel;

    // 2. Presence Channel
    const presenceChannel = supabase.channel(`presence:${room.id}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p: unknown) => {
            const userPres = p as PresenceUser;
            if (!users.some((u) => u.user_id === userPres.user_id)) {
              users.push(userPres);
            }
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: currentUser.id,
            nickname: currentProfile.nickname,
            avatar_url: currentProfile.avatar_url,
            gender: currentProfile.gender,
          });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [room.id, currentUser.id, currentProfile]);

  // Listen for unread private messages & chat requests
  useEffect(() => {
    const supabase = createClient();

    const fetchUnread = async () => {
      try {
        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
          .neq("sender_id", currentUser.id);

        const { count: reqCount } = await supabase
          .from("chat_requests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", currentUser.id)
          .eq("status", "pending");

        setUnreadCount((msgCount || 0) + (reqCount || 0));
      } catch {
        // fail silently for network hiccups
      }
    };

    fetchUnread();

    const channelName = `room_nav_unread_${currentUser.id}_${Date.now()}`;
    const unreadChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => fetchUnread()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => fetchUnread()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_requests",
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unreadChannel);
    };
  }, [currentUser.id]);

  // Fetch & listen to message reactions
  useEffect(() => {
    const supabase = createClient();

    const fetchReactions = async () => {
      try {
        const { data } = await supabase
          .from("room_message_reactions")
          .select("message_id, emoji, user_id");

        if (data) {
          const map: Record<string, Record<string, { count: number; userReacted: boolean }>> = {};
          data.forEach((r: { message_id: string; emoji: string; user_id: string }) => {
            if (!map[r.message_id]) map[r.message_id] = {};
            if (!map[r.message_id][r.emoji]) {
              map[r.message_id][r.emoji] = { count: 0, userReacted: false };
            }
            map[r.message_id][r.emoji].count += 1;
            if (r.user_id === currentUser.id) {
              map[r.message_id][r.emoji].userReacted = true;
            }
          });

          const finalMap: Record<string, ChatMessageReaction[]> = {};
          Object.keys(map).forEach((msgId) => {
            finalMap[msgId] = Object.entries(map[msgId]).map(([emoji, info]) => ({
              emoji,
              count: info.count,
              userReacted: info.userReacted,
            }));
          });
          setReactionsMap(finalMap);
        }
      } catch {
        // Table might not exist yet if migration pending
      }
    };

    fetchReactions();

    const reactionChannel = supabase
      .channel(`reactions_${room.id}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_message_reactions",
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reactionChannel);
    };
  }, [room.id, currentUser.id]);

  // Toggle reaction with optimistic update
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const currentList = prev[messageId] || [];
      const existing = currentList.find((r) => r.emoji === emoji);
      let updated: ChatMessageReaction[];

      if (existing) {
        if (existing.userReacted) {
          if (existing.count === 1) {
            updated = currentList.filter((r) => r.emoji !== emoji);
          } else {
            updated = currentList.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, userReacted: false }
                : r
            );
          }
        } else {
          updated = currentList.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, userReacted: true }
              : r
          );
        }
      } else {
        updated = [...currentList, { emoji, count: 1, userReacted: true }];
      }

      return { ...prev, [messageId]: updated };
    });

    await toggleRoomMessageReaction(messageId, emoji);
  };

  // Admin Pin / Unpin message
  const handleTogglePin = async (messageId: string) => {
    if (!isAdmin) return;
    const newId = pinnedMessageId === messageId ? null : messageId;
    setPinnedMessageId(newId);
    await pinRoomMessage(room.id, newId);
  };

  // Candidates for @mention autocomplete
  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const set = new Map<string, { nickname: string; avatar_url?: string | null }>();
    onlineUsers.forEach((u) => {
      if (u.user_id !== currentUser.id && u.nickname) {
        set.set(u.nickname, { nickname: u.nickname, avatar_url: u.avatar_url });
      }
    });
    messages.forEach((m) => {
      if (m.user_id !== currentUser.id && m.profile?.nickname) {
        set.set(m.profile.nickname, {
          nickname: m.profile.nickname,
          avatar_url: m.profile.avatar_url,
        });
      }
    });

    return Array.from(set.values()).filter((c) =>
      c.nickname.toLowerCase().includes(mentionQuery)
    );
  }, [mentionQuery, onlineUsers, messages, currentUser.id]);

  // Handle selecting an autocomplete mention
  const handleSelectMention = (nick: string) => {
    if (!inputRef.current) return;
    const val = inputText;
    const cursor = inputRef.current.selectionStart || val.length;
    const textBefore = val.slice(0, cursor);
    const textAfter = val.slice(cursor);
    const newBefore = textBefore.replace(/@([\w\u0600-\u06FF]*)$/, `@${nick} `);
    setInputText(newBefore + textAfter);
    setMentionQuery(null);
    inputRef.current.focus();
  };

  // Mobile Long-Press Handlers for Messages
  const handleTouchStart = (msg: ChatMessage, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
      setContextMenuMsg(msg);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleContextMenu = (msg: ChatMessage, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuMsg(msg);
  };

  const handleCopyMessageText = async (text: string) => {
    const cleanText = text.replace(/\[image:[^\]]+\]/g, "").trim();
    if (!cleanText) return;
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setContextMenuMsg(null);
      }, 700);
    } catch {
      // fallback
    }
  };

  // Handle input text change and broadcast typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect @mention
    const cursor = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@([\w\u0600-\u06FF]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }

    const now = Date.now();
    if (val.trim() && now - lastTypingSentRef.current > 2000 && channelRef.current) {
      lastTypingSentRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          nickname: currentProfile.nickname,
          avatar_url: currentProfile.avatar_url,
          userId: currentUser.id,
        },
      });
    }
  };

  // Handle image selection from camera or gallery
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).");
      return;
    }

    const preview = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl: preview });
    e.target.value = "";
    inputRef.current?.focus();
  };

  // Handle message sending (including image upload with compression)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !pendingImage) || isSending || isUploadingImage) return;

    setErrorMessage(null);
    let imageUrl: string | null = null;

    if (pendingImage) {
      setIsUploadingImage(true);
      try {
        const compressedBlob = await compressImage(pendingImage.file);
        const supabase = createClient();
        const ext = "jpg";
        const path = `${currentUser.id}/chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, compressedBlob, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });

        if (uploadError) {
          setErrorMessage(`فشل رفع الصورة: ${uploadError.message}`);
          setIsUploadingImage(false);
          return;
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      } catch {
        setErrorMessage("حدث خطأ أثناء معالجة الصورة قبل الرفع.");
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
      setPendingImage(null);
    }

    let finalContent = "";
    if (imageUrl) {
      finalContent = `[image:${imageUrl}]`;
      if (text) finalContent += ` ${text}`;
    } else {
      finalContent = text;
    }

    const currentReply = replyingTo;
    if (currentReply) {
      finalContent = `> ${currentReply.author}: ${currentReply.text.replace(/\n/g, " ")}\n${finalContent}`;
    }

    setInputText("");
    setReplyingTo(null);

    // Instant 0ms Optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      room_id: room.id,
      user_id: currentUser.id,
      content: finalContent,
      created_at: new Date().toISOString(),
      profile: currentProfile,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 10);

    startTransition(async () => {
      const res = await sendRoomMessage(room.id, finalContent);
      if (res.error) {
        // Rollback temporary message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setErrorMessage(res.error);
        setInputText(text); // restore input so user doesn't lose text
        if (currentReply) setReplyingTo(currentReply);
      } else {
        if (res.message) {
          const sentMsg: ChatMessage = {
            id: res.message.id,
            room_id: res.message.room_id,
            user_id: res.message.user_id,
            content: res.message.content,
            created_at: res.message.created_at,
            profile: currentProfile,
          };
          setMessages((prev) => {
            const hasTemp = prev.some((m) => m.id === tempId);
            if (hasTemp) {
              return prev.map((m) => (m.id === tempId ? sentMsg : m));
            }
            if (prev.some((m) => m.id === sentMsg.id)) return prev;
            return [...prev, sentMsg];
          });
        }
        inputRef.current?.focus();
      }
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الرسالة؟")) return;
    await deleteRoomMessage(messageId);
  };

  // Format message time (e.g. 02:45 م)
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

  const pinnedMessage = messages.find((m) => m.id === pinnedMessageId);

  return (
    <div
      data-theme="dark"
      className="flex h-[100dvh] flex-col bg-[#0B1E24] text-[#FFF7EF] overflow-hidden"
    >
      {/* Clean Room Header - No Clutter */}
      <header className="flex items-center justify-between border-b border-[#20454E] bg-[#0E252D] px-4 py-2.5 sm:px-6 sm:py-3 shrink-0">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            className="text-base sm:text-lg font-black text-coral whitespace-nowrap hover:opacity-90"
          >
            عائلة الحاج متولي
          </Link>
          <span className="text-white/30 text-xs">•</span>
          <h1 className="text-xs sm:text-sm font-semibold truncate text-white/90">
            {room.name}
          </h1>
        </div>

        {/* Minimal Action Controls: Online Presence & Report */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Online Counter Button */}
          <button
            type="button"
            onClick={() => setShowMembers(!showMembers)}
            aria-expanded={showMembers}
            aria-controls="room-members-panel"
            title="المتواجدون الآن في الشات"
            className="flex items-center gap-1.5 rounded-full border border-[#20454E] bg-[#16353D] px-2.5 py-1 text-xs font-semibold text-[#FFF7EF] transition-colors hover:border-coral"
          >
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>{onlineUsers.length || 1} متواجد</span>
          </button>

          {/* Report Room Button */}
          <ReportModal
            targetType="room"
            targetId={room.id}
            targetLabel={room.name}
            triggerButtonText=""
            triggerLabel="الإبلاغ عن الغرفة"
            buttonClassName="rounded-full border border-[#20454E] bg-[#16353D] p-1.5 text-xs text-[#9CB3B8] transition-colors hover:border-red-400/40 hover:text-red-400"
          />
        </div>
      </header>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          id="pinned-message-banner"
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.classList.add("ring-2", "ring-coral");
            setTimeout(() => el?.classList.remove("ring-2", "ring-coral"), 2500);
          }}
          className="flex items-center justify-between border-b border-[#20454E]/70 bg-[#122830] px-4 py-2 text-xs cursor-pointer transition-colors hover:bg-[#16353F] shrink-0"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400 font-bold shrink-0">📌 رسالة مثبتة:</span>
            <span className="font-semibold text-white/90 shrink-0">
              {pinnedMessage.profile?.nickname || "عضو"}:
            </span>
            <span className="truncate text-white/70">
              {parseMessageContent(pinnedMessage.content).message || "صورة"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-coral hover:underline font-semibold">انتقال</span>
            {isAdmin && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleTogglePin(pinnedMessage.id);
                }}
                className="text-white/40 hover:text-red-400 p-1 transition-colors"
                title="إلغاء التثبيت"
                aria-label="إلغاء التثبيت"
              >
                <IconClose size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body: Chat Area + Online Members Drawer */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Messages Stream */}
        <div className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="my-auto text-center text-sm text-[#9CB3B8]">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16353D] text-[#9CB3B8]">
                <IconMessages size={24} />
              </div>
              <p>الدردشة هادئة حالياً. كن أول من يرحب بالحاضرين ويبدأ الحوار!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === currentUser.id;
              const sender = msg.profile || {
                id: msg.user_id,
                nickname: isMe ? currentProfile.nickname : "مستخدم",
                avatar_url: isMe ? currentProfile.avatar_url : null,
                gender: isMe ? currentProfile.gender : null,
              };
              const parsed = parseMessageContent(msg.content);

              return (
                <div
                  id={`msg-${msg.id}`}
                  key={msg.id}
                  className={`flex w-full items-start gap-3 transition-colors rounded-2xl p-1 min-w-0 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Sender Avatar */}
                  <Link
                    href={isMe ? "/profile" : `/profile/${sender.id}`}
                    className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                  >
                    <Avatar
                      src={sender.avatar_url}
                      name={sender.nickname}
                      size="sm"
                      frameClassName="border border-[#20454E] bg-[#16353D]"
                      fallbackClassName="text-xs font-bold text-[#FFF7EF]"
                    />
                  </Link>

                  {/* Message Bubble Container */}
                  <div
                    className={`flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%] ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Header info (Name, Badge, Time, Actions) */}
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-[#9CB3B8]">
                      <Link
                        href={isMe ? "/profile" : `/profile/${sender.id}`}
                        className="font-bold text-[#FFF7EF] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                      >
                        {isMe ? "أنت" : sender.nickname}
                      </Link>
                      <GenderBadge gender={sender.gender} showText={false} />
                      <span aria-hidden="true">•</span>
                      <span>{formatTime(msg.created_at)}</span>

                      {/* Quick Reply button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({
                            id: msg.id,
                            author: isMe ? "أنت" : sender.nickname,
                            text: parsed.message.slice(0, 80),
                          });
                          inputRef.current?.focus();
                        }}
                        title="الرد على الرسالة"
                        className="ms-1 flex items-center gap-0.5 text-[11px] text-[#9CB3B8] transition-colors hover:text-blue-400"
                      >
                        <IconReply size={13} />
                        <span>رد</span>
                      </button>

                      {/* Admin Pin Button */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          title={pinnedMessageId === msg.id ? "إلغاء تثبيت الرسالة" : "تثبيت الرسالة في أعلى الروم"}
                          className={`ms-1 flex items-center gap-0.5 text-[11px] transition-colors ${
                            pinnedMessageId === msg.id ? "text-amber-400 font-bold" : "text-[#9CB3B8] hover:text-amber-400"
                          }`}
                        >
                          <span>📌</span>
                          <span>{pinnedMessageId === msg.id ? "مثبتة" : "تثبيت"}</span>
                        </button>
                      )}

                      {isMe ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          aria-label="حذف الرسالة"
                          title="حذف الرسالة"
                          className="ms-1 text-[#9CB3B8] transition-colors hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                        >
                          <IconClose size={13} />
                        </button>
                      ) : (
                        <ReportModal
                          targetType="message"
                          targetId={msg.id}
                          targetLabel={`رسالة ${sender.nickname}`}
                          triggerButtonText=""
                          triggerLabel="الإبلاغ عن الرسالة"
                          buttonClassName="ms-1 text-[11px] text-[#9CB3B8] transition-colors hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                        />
                      )}
                    </div>

                    {/* Modern sleek bubble with Long-Press support and unbroken text wrapping */}
                    <div
                      onTouchStart={(e) => handleTouchStart(msg, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onContextMenu={(e) => handleContextMenu(msg, e)}
                      title="اضغط مطولاً للمزيد من الخيارات والتفاعلات"
                      className={`min-w-0 max-w-full break-all [overflow-wrap:anywhere] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all select-none cursor-pointer ${
                        isMe
                          ? "rounded-se-none border border-coral/30 bg-[#16363E] text-white"
                          : "rounded-ss-none border border-white/5 bg-[#1F2933] text-[#F3F4F6]"
                      }`}
                    >
                      {/* Quoted message display */}
                      {parsed.hasQuote && (
                        <div className="mb-2.5 rounded-xl border-s-4 border-sky-400 bg-[#14232E] px-3.5 py-2 text-xs">
                          <div className="font-bold text-sky-400 mb-0.5 text-xs">
                            {parsed.quoteAuthor}
                          </div>
                          <div className="text-white/80 line-clamp-2 leading-relaxed">
                            {parsed.quoteText}
                          </div>
                        </div>
                      )}

                      {/* Image display with Lightbox click */}
                      {parsed.imageUrl && (
                        <div className="my-1.5 overflow-hidden rounded-xl bg-black/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={parsed.imageUrl}
                            alt="صورة في الشات"
                            loading="lazy"
                            onClick={() => setActiveLightboxImage(parsed.imageUrl)}
                            className="max-h-72 w-auto max-w-full rounded-xl object-cover cursor-pointer transition-transform hover:scale-[1.01] active:scale-95"
                          />
                        </div>
                      )}

                      {parsed.message && (
                        <div className="whitespace-pre-wrap leading-relaxed break-all [overflow-wrap:anywhere]">
                          {renderMessageTextWithMentions(parsed.message, currentProfile.nickname)}
                        </div>
                      )}
                    </div>

                    {/* Reactions Bar Below Message */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {(reactionsMap[msg.id] || []).map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, r.emoji)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-transform active:scale-90 ${
                            r.userReacted
                              ? "border border-coral/60 bg-coral/20 text-white font-bold"
                              : "border border-white/10 bg-[#16252E] text-white/80 hover:bg-white/10"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className="text-[11px] font-semibold">{r.count}</span>
                        </button>
                      ))}

                      {/* Quick Add Reaction Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveReactionPickerMsgId(
                              activeReactionPickerMsgId === msg.id ? null : msg.id
                            )
                          }
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#16252E] text-white/60 hover:text-white hover:bg-white/15 text-xs transition-colors"
                          title="إضافة تفاعل"
                        >
                          <span>+</span>
                        </button>

                        {/* Floating Reaction Picker Popup with Click-Outside dismiss */}
                        {activeReactionPickerMsgId === msg.id && (
                          <>
                            {/* Backdrop click outside */}
                            <div
                              className="fixed inset-0 z-20 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionPickerMsgId(null);
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                setActiveReactionPickerMsgId(null);
                              }}
                            />
                            <div
                              className={`absolute bottom-full mb-1.5 ${
                                isMe ? "end-0" : "start-0"
                              } z-30 flex items-center gap-1 rounded-full border border-[#20454E] bg-[#0E252D] p-1 shadow-2xl animate-fadeIn`}
                            >
                              {["❤️", "😂", "🔥", "👍", "👏"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    handleToggleReaction(msg.id, emoji);
                                    setActiveReactionPickerMsgId(null);
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform hover:scale-125 active:scale-95 hover:bg-white/10"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* Typing Indicator matching Screenshot */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/70 animate-pulse">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-coral animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-coral animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-coral animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-white/60">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} يكتب الآن...`
                  : `${typingUsers.join("، ")} يكتبون الآن...`}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Online Members Sidebar (Desktop always / Mobile drawer) */}
        {showMembers && (
          <aside
            id="room-members-panel"
            aria-label="المتواجدون الآن"
            className="flex w-64 flex-col justify-between overflow-y-auto border-s border-[#20454E] bg-[#0E252D] p-4"
          >
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-[#20454E] pb-3">
                <h2 className="text-sm font-bold">
                  المتواجدون الآن ({onlineUsers.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMembers(false)}
                  aria-label="إغلاق قائمة المتواجدين"
                  className="text-xs text-[#9CB3B8] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  <IconClose size={16} />
                </button>
              </div>

              <ul className="space-y-2">
                {onlineUsers.map((onlineUser) => {
                  const isCurrent = onlineUser.user_id === currentUser.id;
                  return (
                    <li key={onlineUser.user_id}>
                      <Link
                        href={isCurrent ? "/profile" : `/profile/${onlineUser.user_id}`}
                        className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-[#16353D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                      >
                        <div className="relative shrink-0">
                          <Avatar
                            src={onlineUser.avatar_url}
                            name={onlineUser.nickname}
                            size="xxs"
                            frameClassName="border border-[#20454E] bg-[#16353D]"
                            fallbackClassName="text-xs font-bold"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute bottom-0 end-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0E252D]"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-between">
                          <span className="truncate text-xs font-semibold text-[#FFF7EF]">
                            {onlineUser.nickname} {isCurrent && "(أنت)"}
                          </span>
                          <GenderBadge gender={onlineUser.gender} showText={false} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-[#20454E] pt-4 text-center text-xs text-[#9CB3B8]">
              متولي شات • محادثات فورية
            </div>
          </aside>
        )}
      </div>

      {/* Error Alert Bar */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between border-t border-red-500/50 bg-red-950/90 px-4 py-2.5 text-xs text-red-200"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="إغلاق رسالة الخطأ"
            className="ms-2 font-bold text-red-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <IconClose size={16} />
          </button>
        </div>
      )}

      {/* Input Bar Footer - Matching Substack Chat style */}
      <footer className="shrink-0 border-t border-[#20454E] bg-[#0E252D] p-2 sm:p-3.5 pb-safe">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="mx-auto mb-2 flex max-w-4xl items-center justify-between rounded-xl border border-[#20454E] bg-[#14232c] px-3.5 py-1.5 text-xs">
            <div className="flex items-center gap-2 truncate">
              <IconReply size={15} className="text-sky-400 shrink-0" />
              <span className="font-bold text-sky-400">رد على {replyingTo.author}:</span>
              <span className="truncate text-white/70">{replyingTo.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ms-2 rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="إلغاء الرد"
            >
              <IconClose size={14} />
            </button>
          </div>
        )}

        {/* Mention Autocomplete Popover (@) */}
        {mentionQuery !== null && mentionCandidates.length > 0 && (
          <div className="mx-auto mb-2 max-w-4xl rounded-2xl border border-[#20454E] bg-[#122A31] p-1.5 shadow-2xl animate-fadeIn max-h-48 overflow-y-auto">
            <div className="text-[11px] font-bold text-coral px-2.5 py-1">الإشارة إلى عضو (@):</div>
            <div className="space-y-0.5">
              {mentionCandidates.slice(0, 6).map((candidate) => (
                <button
                  key={candidate.nickname}
                  type="button"
                  onClick={() => handleSelectMention(candidate.nickname)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-white hover:bg-white/10 transition-colors text-start"
                >
                  <Avatar src={candidate.avatar_url} name={candidate.nickname} size="xxs" />
                  <span className="font-semibold text-white/95">{candidate.nickname}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending Image Preview Box */}
        {pendingImage && (
          <div className="mx-auto mb-2 flex max-w-4xl items-center justify-between rounded-2xl border border-coral/40 bg-[#14232E] p-2 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.previewUrl}
                alt="معاينة الصورة"
                className="h-12 w-12 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <div className="truncate">
                <div className="font-bold text-coral text-xs">صورة جاهزة للإرسال</div>
                <div className="text-white/60 text-[11px] truncate max-w-xs">{pendingImage.file.name}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="إلغاء الصورة"
              title="إلغاء الصورة"
            >
              <IconClose size={16} />
            </button>
          </div>
        )}

        {/* Real-time Typing Indicator Bar - Matching Screenshot */}
        {typingUsers.length > 0 && (
          <div className="mx-auto mb-1.5 flex max-w-4xl items-center gap-2 px-2 text-xs text-white/75">
            {typingUsers[0]?.avatar_url ? (
              <Avatar
                src={typingUsers[0].avatar_url}
                name={typingUsers[0].nickname}
                size="xxs"
                frameClassName="border border-white/20"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-coral/30 text-[9px] font-bold text-coral">
                {typingUsers[0]?.nickname?.[0]}
              </div>
            )}
            <span className="font-semibold text-white/90">
              {typingUsers.map((u) => u.nickname).join("، ")}
            </span>
            <span className="text-white/50">• يكتب الآن...</span>
            <div className="flex items-center gap-0.5 ms-1">
              <span className="h-1 w-1 rounded-full bg-coral animate-bounce" />
              <span className="h-1 w-1 rounded-full bg-coral animate-bounce [animation-delay:0.2s]" />
              <span className="h-1 w-1 rounded-full bg-coral animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-center gap-2">
          {/* User's Avatar (always visible like Substack) */}
          <div className="shrink-0">
            <Avatar
              src={currentProfile.avatar_url}
              name={currentProfile.nickname}
              size="sm"
              frameClassName="border border-[#20454E] bg-[#16353D]"
            />
          </div>

          {/* Substack-style Pill Input with Inner Circular Send Arrow */}
          <div className="relative flex flex-1 items-center rounded-full border border-[#20454E] bg-[#16353D] ps-3.5 pe-1.5 py-1 focus-within:border-coral focus-within:ring-1 focus-within:ring-coral transition-colors">
            <label htmlFor="room-message-input" className="sr-only">
              اكتب رسالة
            </label>
            <input
              id="room-message-input"
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              disabled={isSending}
              placeholder={replyingTo ? `الرد على ${replyingTo.author}...` : "اكتب رسالة..."}
              maxLength={2000}
              className="flex-1 bg-transparent py-1.5 text-sm text-[#FFF7EF] placeholder:text-[#9CB3B8]/60 focus:outline-none min-w-0"
            />

            {/* Circular Send Arrow Button Inside Pill */}
            <button
              type="submit"
              disabled={isSending || isUploadingImage || (!inputText.trim() && !pendingImage)}
              aria-label="إرسال"
              className="inline-flex h-8 w-8 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm transition-all hover:bg-coral-hover active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
            >
              {isUploadingImage ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <IconSend size={15} />
              )}
            </button>
          </div>

          {/* Outer Media & Emoji Icons like Substack */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-[#9CB3B8] shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept="image/*"
              className="hidden"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="إرفاق صورة من الكاميرا أو المعرض"
              aria-label="إرفاق صورة"
              className={`rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white ${
                pendingImage ? "text-coral bg-coral/15" : ""
              }`}
            >
              <IconImage size={20} />
            </button>
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

      {/* Substack-style Bottom Navigation Bar - Exactly matching Screenshot */}
      <nav
        aria-label="شريط التنقل السفلي"
        className="shrink-0 border-t border-[#20454E]/70 bg-[#0A1B20] px-3 py-1 sm:py-1.5 pb-safe"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {/* 1. الرئيسية */}
          <Link
            href="/"
            title="الرئيسية"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconHome size={22} />
          </Link>

          {/* 2. الدردشة الجماعية (Active) */}
          <Link
            href="/rooms/main"
            title="الدردشة الجماعية"
            className="flex flex-col items-center justify-center p-2 text-coral transition-colors"
          >
            <IconMessages size={22} className="text-coral" />
          </Link>

          {/* 3. الأعضاء (Discover) */}
          <Link
            href="/discover"
            title="الأعضاء"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconUsers size={22} />
          </Link>

          {/* 4. الرسائل الخاصة (with Unread Badge) */}
          <Link
            href="/messages"
            title="الرسائل الخاصة"
            className="relative flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconDirectMessage size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-[#0A1B20] animate-pulse">
                {unreadCount > 99 ? "+99" : unreadCount}
              </span>
            )}
          </Link>

          {/* 5. إعداداتي */}
          <Link
            href="/settings"
            title="إعداداتي"
            className="flex flex-col items-center justify-center p-2 text-white/50 transition-colors hover:text-white"
          >
            <IconSettings size={22} />
          </Link>
        </div>
      </nav>

      {/* Mobile Long-Press Context Menu Modal */}
      {contextMenuMsg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setContextMenuMsg(null)}
          />

          {/* Action Sheet Panel */}
          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-[#20454E] bg-[#122A31] p-4 text-white shadow-2xl z-10 animate-slideUp">
            {/* Top drag bar */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

            {/* Quick Emoji Reaction Row */}
            <div className="mb-3 flex items-center justify-around rounded-2xl border border-[#20454E] bg-[#0E252D] p-1.5">
              {["❤️", "😂", "🔥", "👍", "👏", "😮", "😢", "🙏"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleToggleReaction(contextMenuMsg.id, emoji);
                    setContextMenuMsg(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 active:scale-95 hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Preview of selected message */}
            <div className="mb-3 rounded-xl border border-white/5 bg-[#0E252D]/60 p-2.5 text-xs text-[#9CB3B8] line-clamp-2">
              <span className="font-bold text-coral">
                {contextMenuMsg.user_id === currentUser.id
                  ? "رسالتك"
                  : contextMenuMsg.profile?.nickname || "رسالة"}:
              </span>{" "}
              {parseMessageContent(contextMenuMsg.content).message || "محتوى وسائط"}
            </div>

            {/* Action Buttons List */}
            <div className="space-y-1">
              {/* 1. Reply */}
              <button
                type="button"
                onClick={() => {
                  const author =
                    contextMenuMsg.user_id === currentUser.id
                      ? "أنت"
                      : contextMenuMsg.profile?.nickname || "مستخدم";
                  setReplyingTo({
                    id: contextMenuMsg.id,
                    author,
                    text: parseMessageContent(contextMenuMsg.content).message.slice(0, 80),
                  });
                  setContextMenuMsg(null);
                  inputRef.current?.focus();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors text-start"
              >
                <IconReply size={18} className="text-sky-400" />
                <span>رد على هذه الرسالة</span>
              </button>

              {/* 2. Copy Text */}
              <button
                type="button"
                onClick={() => handleCopyMessageText(contextMenuMsg.content)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors text-start"
              >
                <IconCopy size={18} className="text-emerald-400" />
                <span>{copySuccess ? "تم نسخ النص بنجاح ✓" : "نسخ النص"}</span>
              </button>

              {/* 3. Admin Pin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePin(contextMenuMsg.id);
                    setContextMenuMsg(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors text-start"
                >
                  <span className="text-base">📌</span>
                  <span>
                    {pinnedMessageId === contextMenuMsg.id
                      ? "إلغاء تثبيت الرسالة"
                      : "تثبيت في أعلى الشات"}
                  </span>
                </button>
              )}

              {/* 4. Delete */}
              {(contextMenuMsg.user_id === currentUser.id || isAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    const id = contextMenuMsg.id;
                    setContextMenuMsg(null);
                    handleDeleteMessage(id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-start"
                >
                  <IconClose size={18} className="text-red-400" />
                  <span>حذف الرسالة</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setContextMenuMsg(null)}
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-[#20454E] bg-[#16353D] py-2.5 text-xs font-bold text-[#9CB3B8] hover:text-white transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Fullscreen Image Viewing */}
      <Lightbox
        src={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />
    </div>
  );
}
