import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/profile";
import { RoomChat } from "@/components/rooms/room-chat";
import { IconMessages } from "@/components/ui/icons";
import type { ChatMessage, Room } from "@/components/rooms/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase } = await getCurrentUserProfile();

  const { data: room } = await supabase
    .from("rooms")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();

  return {
    title: room ? `${room.name} - عائلة الحاج متولي` : "غرفة المحادثة - عائلة الحاج متولي",
    description: room?.description || "غرفة المحادثة الفورية لعائلة الحاج متولي",
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect(`/login?redirect=/rooms/${slug}`);
  }

  // Fetch Room
  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!roomData) {
    // If the requested slug is not found, check if ANY active room exists
    const { data: fallbackRoom } = await supabase
      .from("rooms")
      .select("slug")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (fallbackRoom && fallbackRoom.slug !== slug) {
      redirect(`/rooms/${fallbackRoom.slug}`);
    }

    // If no room is active in the database yet, show a friendly status screen instead of 404
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-white">
        <div className="ios-glass max-w-md rounded-[30px] p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#0A84FF]/30 bg-[#0A84FF]/20 text-[#409CFF]">
            <IconMessages size={30} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">غرفة الدردشة الجماعية</h1>
          <p className="mb-6 text-sm leading-relaxed text-white/60">
            غرفة الدردشة قيد التجهيز. إذا كنت مدير النظام، يرجى تشغيل استعلام تفعيل الغرفة في Supabase.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="ios-btn-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              العودة للرئيسية
            </Link>
            <Link
              href="/rooms"
              className="ios-btn-glass inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              إعادة المحاولة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const room = roomData as Room;

  // Fetch last 50 messages
  const { data: rawMessages } = await supabase
    .from("room_messages")
    .select("id, room_id, user_id, content, created_at")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const reversed = (rawMessages || []).reverse();

  // Fetch sender profiles for these messages
  const senderIds = Array.from(new Set(reversed.map((m) => m.user_id)));
  let profilesMap: Record<
    string,
    {
      id: string;
      nickname: string;
      avatar_url: string | null;
      gender: "male" | "female" | null;
    }
  > = {};

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, avatar_url, gender")
      .in("id", senderIds);

    if (profiles) {
      profilesMap = profiles.reduce(
        (acc, p) => ({ ...acc, [p.id]: p as typeof profilesMap[string] }),
        {}
      );
    }
  }

  const initialMessages: ChatMessage[] = reversed.map((m) => ({
    ...m,
    profile: profilesMap[m.user_id] || null,
  }));

  return (
    <div>
      <RoomChat
        room={room}
        currentUser={{ id: user.id, email: user.email }}
        currentProfile={profile}
        initialMessages={initialMessages}
      />
    </div>
  );
}
