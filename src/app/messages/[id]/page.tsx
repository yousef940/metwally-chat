import { notFound, redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { PrivateChat, type PrivateMessage } from "@/components/messages/private-chat";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getCurrentUserProfile();

  if (!user) return { title: "المحادثة الخاصة - عيلة الحاج متولي" };

  const { data: conv } = await supabase
    .from("conversations")
    .select("participant_one, participant_two")
    .eq("id", id)
    .maybeSingle();

  if (!conv) return { title: "المحادثة - عيلة الحاج متولي" };

  const otherId =
    conv.participant_one === user.id ? conv.participant_two : conv.participant_one;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", otherId)
    .maybeSingle();

  return {
    title: otherProfile?.nickname
      ? `محادثة مع ${otherProfile.nickname} - عيلة الحاج متولي`
      : "المحادثة الخاصة - عيلة الحاج متولي",
  };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect(`/login?redirect=/messages/${id}`);
  }

  // 1. Fetch Conversation
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", id)
    .maybeSingle();

  if (convErr || !conv) {
    notFound();
  }

  if (conv.participant_one !== user.id && conv.participant_two !== user.id) {
    redirect("/messages");
  }

  const otherUserId =
    conv.participant_one === user.id ? conv.participant_two : conv.participant_one;

  // 2. Mutual Block Check
  const { data: isBlocked } = await supabase.rpc("is_blocked", {
    user_a: user.id,
    user_b: otherUserId,
  });

  if (isBlocked) {
    redirect("/messages");
  }

  // 3. Fetch other user profile
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, gender, country, city")
    .eq("id", otherUserId)
    .maybeSingle();

  // 4. Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, is_read, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  // 5. Check if muted
  const { data: muteRecord } = await supabase
    .from("conversation_mutes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("conversation_id", id)
    .maybeSingle();

  return (
    <PrivateChat
      conversationId={id}
      currentUserId={user.id}
      currentUser={{
        id: user.id,
        nickname: profile?.nickname || "مستخدم",
        avatar_url: profile?.avatar_url || null,
      }}
      otherUser={
        otherProfile || {
          id: otherUserId,
          nickname: "مستخدم",
          avatar_url: null,
          gender: null,
        }
      }
      initialMessages={(messages || []) as PrivateMessage[]}
      initialMuted={!!muteRecord}
    />
  );
}
