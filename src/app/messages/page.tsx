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

  // 1. Fetch Conversations
  const { data: convs } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two, updated_at")
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order("updated_at", { ascending: false });

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
        (acc, p) => ({ ...acc, [p.id]: p as typeof profilesMap[string] }),
        {}
      );
    }
  }

  const conversationItems: ConversationItem[] = [];

  if (convs && convs.length > 0) {
    for (const c of convs) {
      const otherId =
        c.participant_one === user.id ? c.participant_two : c.participant_one;
      const otherUser = profilesMap[otherId] || {
        id: otherId,
        nickname: "مستخدم",
        avatar_url: null,
        gender: null,
        country: "",
      };

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      conversationItems.push({
        id: c.id,
        updated_at: c.updated_at,
        otherUser,
        lastMessage: lastMsg,
        unreadCount: unreadCount || 0,
      });
    }
  }

  // 2. Fetch Incoming Requests
  const { data: incomingReqs } = await supabase
    .from("chat_requests")
    .select("id, sender_id, initial_message, created_at")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // 3. Fetch Outgoing Requests
  const { data: outgoingReqs } = await supabase
    .from("chat_requests")
    .select("id, receiver_id, initial_message, created_at")
    .eq("sender_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

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
    <div className="min-h-screen bg-[#0B1E24] text-[#FFF7EF]">
      {/* Top Navbar */}
      <AppHeader user={user} profile={profile} />

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 pb-24 md:pb-8">
        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="أقسام الرسائل"
          className="mb-6 flex gap-6 border-b border-[#20454E]"
        >
          <Link
            href="/messages?tab=chats"
            role="tab"
            aria-selected={tab === "chats"}
            className={`relative pb-3 text-sm font-bold transition-all ${
              tab === "chats"
                ? "border-b-2 border-coral text-coral"
                : "text-[#9CB3B8] hover:text-white"
            }`}
          >
            المحادثات النشطة ({conversationItems.length})
          </Link>

          <Link
            href="/messages?tab=requests"
            role="tab"
            aria-selected={tab === "requests"}
            className={`relative flex items-center gap-1.5 pb-3 text-sm font-bold transition-all ${
              tab === "requests"
                ? "border-b-2 border-coral text-coral"
                : "text-[#9CB3B8] hover:text-white"
            }`}
          >
            <span>طلبات المحادثة</span>
            {incomingCount > 0 && (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold text-white">
                {incomingCount}
              </span>
            )}
          </Link>
        </div>

        {/* Tab 1: Conversations List */}
        {tab === "chats" && (
          <div className="space-y-3">
            {conversationItems.length === 0 ? (
              <div className="rounded-2xl border border-[#20454E] bg-[#122A31] p-12 text-center shadow-sm">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white">
                  لا توجد محادثات نشطة بعد
                </h3>
                <p className="mt-1 text-sm text-[#9CB3B8] max-w-md mx-auto leading-relaxed">
                  تصفح قائمة الأعضاء أو ادخل الغرفة العامة لإرسال رسائل والبدء في التواصل مباشرة.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href="/rooms/main"
                    className="rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover"
                  >
                    دخول الدردشة الجماعية
                  </Link>
                  <Link
                    href="/discover"
                    className="rounded-xl border border-[#20454E] bg-[#16353D] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:border-coral"
                  >
                    تصفح الأعضاء
                  </Link>
                </div>
              </div>
            ) : (
              conversationItems.map((conv) => {
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
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[#20454E] bg-[#122A31] p-4 shadow-sm transition-all hover:border-coral/50 hover:bg-[#16353D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      {/* Avatar */}
                      <Avatar
                        src={conv.otherUser.avatar_url}
                        name={conv.otherUser.nickname}
                        size="md"
                        frameClassName="border border-[#20454E] bg-[#16353D]"
                        fallbackClassName="font-bold text-white/50"
                      />

                      {/* Info & Last message */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-base font-bold text-white transition-colors group-hover:text-coral">
                            {conv.otherUser.nickname}
                          </span>
                          <GenderBadge gender={conv.otherUser.gender} showText={false} />
                        </div>

                        <p className="mt-0.5 max-w-md truncate text-xs text-[#9CB3B8]">
                          {conv.lastMessage ? (
                            conv.lastMessage.content
                          ) : (
                            <span className="italic text-[#9CB3B8]/60">
                              تم بدء المحادثة
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Time & Unread Badge */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-[#9CB3B8]/60">{formattedTime}</span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white shadow-sm">
                          {conv.unreadCount}
                          <span className="sr-only"> رسالة غير مقروءة</span>
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
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
                <div className="rounded-2xl border border-[#20454E] bg-[#122A31] p-8 text-center text-sm text-[#9CB3B8]">
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
            <div className="pt-4 border-t border-[#20454E]">
              <h2 className="text-base font-bold text-white mb-3">
                الطلبات الصادرة بانتظار الرد ({outgoingReqs?.length || 0})
              </h2>

              {(!outgoingReqs || outgoingReqs.length === 0) ? (
                <div className="rounded-2xl border border-[#20454E] bg-[#122A31] p-6 text-center text-xs text-[#9CB3B8]">
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
