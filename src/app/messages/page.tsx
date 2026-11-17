import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { GenderBadge } from "@/components/profile/gender-badge";
import { RequestItem } from "@/components/messages/request-item";
import { AppHeader } from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الرسائل الخاصة - عيلة الحاج متولي",
  description: "صندوق الرسائل والمحادثات الخاصة في عيلة الحاج متولي",
};

interface ConversationItem {
  id: string;
  updated_at: string;
  otherUser: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    gender: "male" | "female" | null;
    country: string;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "chats" } = await searchParams;
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login?redirect=/messages");
  }

  // 1. Fetch Conversations, Incoming Requests, and Outgoing Requests in parallel
  const [
    { data: convs },
    { data: incomingReqs },
    { data: outgoingReqs },
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, participant_one, participant_two, updated_at")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("updated_at", { ascending: false }),
    supabase
      .from("chat_requests")
      .select("id, sender_id, initial_message, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_requests")
      .select("id, receiver_id, initial_message, created_at")
      .eq("sender_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const otherUserIds = Array.from(
    new Set(
      (convs || []).map((c) =>
        c.participant_one === user.id ? c.participant_two : c.participant_one
      )
    )
  );

  let profilesMap: Record<
    string,
    {
      id: string;
      nickname: string;
      avatar_url: string | null;
      gender: "male" | "female" | null;
      country: string;
    }
  > = {};

  if (otherUserIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nickname, avatar_url, gender, country")
      .in("id", otherUserIds);

    if (profs) {
      profilesMap = profs.reduce(
        (acc, p) => ({ ...acc, [p.id]: p as (typeof profilesMap)[string] }),
        {}
      );
    }
  }

  // Fetch last messages & unread counts in parallel for all conversations
  const conversationItems: ConversationItem[] = await Promise.all(
    (convs || []).map(async (c) => {
      const otherId =
        c.participant_one === user.id ? c.participant_two : c.participant_one;
      const otherUser = profilesMap[otherId] || {
        id: otherId,
        nickname: "مستخدم",
        avatar_url: null,
        gender: null,
        country: "",
      };

      const [{ data: lastMsg }, { count: unreadCount }] = await Promise.all([
        supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", user.id)
          .eq("is_read", false),
      ]);

      return {
        id: c.id,
        updated_at: c.updated_at,
        otherUser,
        lastMessage: lastMsg,
        unreadCount: unreadCount || 0,
      };
    })
  );

  // Fetch profiles for incoming and outgoing
  const reqSenderIds = (incomingReqs || []).map((r) => r.sender_id);
  const reqReceiverIds = (outgoingReqs || []).map((r) => r.receiver_id);
  const allReqUserIds = Array.from(new Set([...reqSenderIds, ...reqReceiverIds]));

  let reqProfilesMap: Record<
    string,
    {
      id: string;
      nickname: string;
      avatar_url: string | null;
      gender: "male" | "female" | null;
      country?: string;
    }
  > = {};

  if (allReqUserIds.length > 0) {
    const { data: reqProfs } = await supabase
      .from("profiles")
      .select("id, nickname, avatar_url, gender, country")
      .in("id", allReqUserIds);

    if (reqProfs) {
      reqProfilesMap = reqProfs.reduce(
        (acc, p) => ({ ...acc, [p.id]: p as typeof reqProfilesMap[string] }),
        {}
      );
    }
  }

  const incomingCount = incomingReqs?.length || 0;

  return (
    <div className="min-h-screen text-white">
      {/* Top Navbar */}
      <AppHeader user={user} profile={profile} />

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6 pb-28 md:pb-10">
        {/* Page Title */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            الرسائل
          </h1>
        </div>

        {/* iOS 27 Segmented Control Tabs */}
        <div
          role="tablist"
          aria-label="أقسام الرسائل"
          className="ios-segmented mb-6 inline-flex w-full sm:w-auto items-center gap-1 rounded-full p-1"
        >
          <Link
            href="/messages?tab=chats"
            role="tab"
            aria-selected={tab === "chats"}
            className={`flex-1 sm:flex-initial text-center rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
              tab === "chats"
                ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            المحادثات النشطة ({conversationItems.length})
          </Link>

          <Link
            href="/messages?tab=requests"
            role="tab"
            aria-selected={tab === "requests"}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
              tab === "requests"
                ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>طلبات المحادثة</span>
            {incomingCount > 0 && (
              <span className="rounded-full bg-[#FF453A] px-2 py-0.5 text-[11px] font-bold text-white">
                {incomingCount}
              </span>
            )}
          </Link>
        </div>

        {/* Tab 1: Conversations List */}
        {tab === "chats" && (
          <div className="space-y-3">
            {conversationItems.length === 0 ? (
              <div className="ios-glass rounded-[28px] p-12 text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white">
                  لا توجد محادثات نشطة بعد
                </h3>
                <p className="mt-1.5 text-sm text-white/60 max-w-md mx-auto leading-relaxed">
                  تصفح قائمة الأعضاء أو ادخل الغرفة العامة لإرسال رسائل والبدء في التواصل مباشرة.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/rooms/main"
                    className="ios-btn-primary rounded-full px-5 py-2.5 text-xs font-bold transition-all active:scale-95"
                  >
                    دخول الدردشة الجماعية
                  </Link>
                  <Link
                    href="/discover"
                    className="ios-btn-glass rounded-full px-5 py-2.5 text-xs font-bold transition-all active:scale-95"
                  >
                    تصفح الأعضاء
                  </Link>
                </div>
              </div>
            ) : (
              <div className="ios-card overflow-hidden rounded-[24px] divide-y divide-white/[0.08]">
                {conversationItems.map((conv) => {
                  const formattedTime = new Date(
                    conv.lastMessage?.created_at || conv.updated_at
                  ).toLocaleDateString("ar-EG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.06] active:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0A84FF]"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        {/* Avatar */}
                        <Avatar
                          src={conv.otherUser.avatar_url}
                          name={conv.otherUser.nickname}
                          size="md"
                          frameClassName="border border-white/[0.14] bg-[#2C2C2E]"
                          fallbackClassName="font-bold text-white/60"
                        />

                        {/* Info & Last message */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-base font-bold text-white transition-colors group-hover:text-[#409CFF]">
                              {conv.otherUser.nickname}
                            </span>
                            <GenderBadge gender={conv.otherUser.gender} showText={false} />
                          </div>

                          <p className="mt-0.5 max-w-md truncate text-xs text-white/60">
                            {conv.lastMessage ? (
                              conv.lastMessage.content
                            ) : (
                              <span className="italic text-white/40">
                                تم بدء المحادثة
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Time & Unread Badge */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[11px] text-white/45">{formattedTime}</span>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0A84FF] px-1.5 text-[11px] font-bold text-white shadow-sm">
                            {conv.unreadCount}
                            <span className="sr-only"> رسالة غير مقروءة</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Requests List */}
        {tab === "requests" && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-base font-bold text-white mb-3">
                الطلبات الواردة ({incomingCount})
              </h2>

              {incomingCount === 0 ? (
                <div className="ios-card rounded-[24px] p-8 text-center text-sm text-white/60">
                  لا توجد طلبات محادثة واردة جديدة حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingReqs?.map((req) => (
                    <RequestItem
                      key={req.id}
                      id={req.id}
                      initialMessage={req.initial_message}
                      createdAt={req.created_at}
                      isIncoming={true}
                      user={
                        reqProfilesMap[req.sender_id] || {
                          id: req.sender_id,
                          nickname: "مستخدم",
                          avatar_url: null,
                          gender: null,
                        }
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="pt-4 border-t border-white/[0.10]">
              <h2 className="text-base font-bold text-white mb-3">
                الطلبات الصادرة بانتظار الرد ({outgoingReqs?.length || 0})
              </h2>

              {(!outgoingReqs || outgoingReqs.length === 0) ? (
                <div className="ios-card rounded-[24px] p-6 text-center text-xs text-white/55">
                  لم ترسل أي طلبات محادثة معلقة حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingReqs.map((req) => (
                    <RequestItem
                      key={req.id}
                      id={req.id}
                      initialMessage={req.initial_message}
                      createdAt={req.created_at}
                      isIncoming={false}
                      user={
                        reqProfilesMap[req.receiver_id] || {
                          id: req.receiver_id,
                          nickname: "مستخدم",
                          avatar_url: null,
                          gender: null,
                        }
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
