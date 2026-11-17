import { redirect } from "next/navigation";
import { getCurrentUserProfile, type Profile } from "@/lib/profile";
import { AppHeader } from "@/components/layout/header";
import { MemberListView } from "@/components/discover/member-list-view";
import { AppFooter } from "@/components/ui/app-footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الأعضاء - متولي شات",
  description: "تصفح قائمة الأصدقاء والأعضاء وتواصل معهم مباشرة",
};

/**
 * Discover Members Page.
 * Server component that applies strict RLS, privacy controls, mutual block filtering,
 * and passes the members list to the interactive real-time view.
 */
export default async function DiscoverPage() {
  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login?redirect=/discover");
  }

  // 1. Gather all users who should be excluded:
  // - Current user themselves
  // - Users blocked by current user
  // - Users who blocked current user
  // - Users who are currently banned
  const excludedIds = new Set<string>([user.id]);

  // Fetch mutual blocks
  const { data: userBlocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  if (userBlocks) {
    for (const b of userBlocks) {
      if (b.blocker_id === user.id) excludedIds.add(b.blocked_id);
      if (b.blocked_id === user.id) excludedIds.add(b.blocker_id);
    }
  }

  // Fetch active bans
  const { data: activeBans } = await supabase
    .from("bans")
    .select("user_id")
    .is("unbanned_at", null);

  if (activeBans) {
    for (const b of activeBans) {
      excludedIds.add(b.user_id);
    }
  }

  const excludedArray = Array.from(excludedIds);

  // 2. Fetch existing conversations & pending chat requests
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

  const convMap: Record<string, string> = {};
  if (conversations) {
    for (const c of conversations) {
      const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;
      convMap[otherId] = c.id;
    }
  }

  const { data: pendingRequests } = await supabase
    .from("chat_requests")
    .select("receiver_id")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  const pendingList = (pendingRequests || []).map((r) => r.receiver_id);

  // 3. Build the query on public profiles
  let query = supabase
    .from("profiles")
    .select("id, nickname, avatar_url, gender, age, country, city, bio, interests, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (excludedArray.length > 0) {
    query = query.not("id", "in", `(${excludedArray.join(",")})`);
  }

  const { data: members, error } = await query;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <AppHeader user={user} profile={profile} />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 pb-28 md:pb-10">
          {/* Header Banner */}
          <div className="ios-glass mb-6 rounded-[26px] p-5 text-white sm:p-6">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              الأعضاء
            </h1>
            <p className="mt-1 text-xs text-white/60 leading-relaxed">
              تواصل مع أصدقائك وتعرف على المتواجدين الآن في الشات
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-[#FF453A]/35 bg-[#2A1415] p-4 text-xs text-[#FF9B95]"
            >
              حدث خطأ أثناء تحميل قائمة الأعضاء: {error.message}
            </div>
          )}

          {/* Interactive Member List with Search & Online/Offline tabs */}
          <MemberListView
            members={(members as Profile[]) || []}
            currentUserId={user.id}
            convMap={convMap}
            pendingSet={pendingList}
          />
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
