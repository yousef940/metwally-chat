"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { CountryBadge } from "@/components/profile/country-badge";
import { GenderBadge } from "@/components/profile/gender-badge";
import { SendRequestModal } from "@/components/messages/send-request-modal";
import { IconSearch, IconUsers } from "@/components/ui/icons";
import type { Profile } from "@/lib/profile";

interface MemberListViewProps {
  members: Profile[];
  currentUserId: string;
  convMap: Record<string, string>;
  pendingSet: string[];
}

export function MemberListView({
  members,
  currentUserId,
  convMap,
  pendingSet,
}: MemberListViewProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "online" | "offline">("all");
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const pendingRequestSet = useMemo(() => new Set(pendingSet), [pendingSet]);

  // Subscribe to presence on room:main to know who is online in real-time
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("room:main", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.keys(state).forEach((key) => {
          ids.add(key);
        });
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = member.nickname?.toLowerCase().includes(query);
        const matchesCity = member.city?.toLowerCase().includes(query);
        const matchesCountry = member.country?.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesCountry) return false;
      }

      // Online status filter
      const isOnline = onlineUserIds.has(member.id);
      if (filterTab === "online") return isOnline;
      if (filterTab === "offline") return !isOnline;

      return true;
    });
  }, [members, search, filterTab, onlineUserIds]);

  const onlineCount = useMemo(() => {
    return members.filter((m) => onlineUserIds.has(m.id)).length;
  }, [members, onlineUserIds]);

  const offlineCount = members.length - onlineCount;

  return (
    <div className="space-y-6">
      {/* Search & Tabs Controls */}
      <div className="rounded-2xl border border-[#20454E] bg-[#122A31] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#9CB3B8]"
            >
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن عضو..."
              aria-label="البحث عن أعضاء"
              className="w-full rounded-xl border border-[#20454E] bg-[#0E252D] py-2.5 pe-4 ps-10 text-sm text-white placeholder-[#6B858D] focus:border-coral focus:outline-none"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#20454E] bg-[#0E252D] p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-coral text-white shadow-sm"
                  : "text-[#9CB3B8] hover:text-white"
              }`}
            >
              الكل ({members.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("online")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "online"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#9CB3B8] hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>المتصلين ({onlineCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("offline")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "offline"
                  ? "bg-[#20454E] text-white shadow-sm"
                  : "text-[#9CB3B8] hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white/40" />
              <span>غير متصل ({offlineCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid or Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-[#20454E] bg-[#122A31] p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E252D] text-[#9CB3B8]">
            <IconUsers size={28} />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            {members.length === 0 ? "أهلاً بك في عائلة الحاج متولي" : "لا توجد نتائج مطابقة"}
          </h3>
          <p className="mt-1 text-xs text-[#9CB3B8] max-w-sm mx-auto leading-relaxed">
            {members.length === 0
              ? "أنت أول المسجلين! شارك رابط الشات مع أصدقائك لينضموا إليك في الغرف والمحادثات."
              : search.trim()
              ? "لم يتم العثور على أي عضو بهذا الاسم."
              : filterTab === "online"
              ? "لا يوجد أعضاء آخرين متصلين حالياً."
              : "لا توجد نتائج في هذا القسم."}
          </p>
          {members.length === 0 ? (
            <Link
              href="/rooms/main"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-coral-hover"
            >
              الدخول إلى غرفة الدردشة الجماعية
            </Link>
          ) : (
            (search || filterTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterTab("all");
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-coral-hover"
              >
                عرض جميع الأعضاء
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const isOnline = onlineUserIds.has(member.id);
            const hasConv = convMap[member.id];
            const hasPending = pendingRequestSet.has(member.id);
            const profileHref = `/profile/${member.id}`;

            return (
              <article
                key={member.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#20454E] bg-[#122A31] p-4 shadow-sm transition-all hover:border-coral/50 hover:bg-[#16353D]"
              >
                {/* Header: Avatar, Online Dot, Info */}
                <div className="flex items-start gap-3.5">
                  <Link href={profileHref} className="relative shrink-0">
                    <Avatar
                      src={member.avatar_url}
                      name={member.nickname}
                      size="lg"
                      shape="rounded"
                      frameClassName="border-2 border-[#20454E] bg-[#0E252D]"
                      fallbackClassName="text-lg font-bold text-coral"
                    />
                    <span
                      title={isOnline ? "متصل الآن" : "غير متصل"}
                      className={`absolute bottom-0 end-0 h-3 w-3 rounded-full ring-2 ring-[#122A31] ${
                        isOnline ? "bg-emerald-500" : "bg-gray-500"
                      }`}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        href={profileHref}
                        className="truncate font-bold text-white transition-colors group-hover:text-coral"
                      >
                        {member.nickname}
                      </Link>
                      <GenderBadge gender={member.gender} showText={false} />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <CountryBadge country={member.country} city={member.city} />
                      {member.age && (
                        <span className="rounded-lg border border-[#20454E] bg-[#0E252D] px-2 py-0.5 text-xs font-semibold text-coral">
                          {member.age} سنة
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 text-[11px] text-[#9CB3B8]">
                      {isOnline ? (
                        <span className="font-semibold text-emerald-400">متصل الآن</span>
                      ) : (
                        <span>غير متصل</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio snippet if any */}
                {member.bio && (
                  <p className="mt-3 line-clamp-2 text-xs text-white/70 leading-relaxed">
                    {member.bio}
                  </p>
                )}

                {/* Action button */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#20454E] pt-3">
                  <Link
                    href={profileHref}
                    className="flex-1 rounded-xl border border-[#20454E] bg-[#0E252D] px-3 py-2 text-center text-xs font-semibold text-white/90 transition-colors hover:border-coral/40 hover:bg-[#16353D] hover:text-white"
                  >
                    الملف الشخصي
                  </Link>

                  <div className="shrink-0">
                    <SendRequestModal
                      receiverId={member.id}
                      receiverNickname={member.nickname}
                      hasExistingConversation={hasConv || null}
                      hasPendingRequest={hasPending}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
