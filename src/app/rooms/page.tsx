import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الدردشة الجماعية - عيلة الحاج متولي",
  description: "الدردشة الجماعية المباشرة لعيلة الحاج متولي",
};

/**
 * Direct entry to the single group chat room.
 * Automatically resolves the active room and redirects into the conversation.
 */
export default async function RoomsPage() {
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login?redirect=/rooms");
  }

  // Find the single primary active room (e.g. 'main', or first room)
  const { data: room } = await supabase
    .from("rooms")
    .select("slug")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const targetSlug = room?.slug || "main";
  redirect(`/rooms/${targetSlug}`);
}
