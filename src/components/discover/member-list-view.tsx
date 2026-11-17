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
      {/* iOS 27 Search & Segmented Control Bar */}
      <div className="ios-card rounded-[24px] p-4">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-white/45"
            >
              <IconSearch size={17} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن عضو..."
              aria-label="البحث عن أعضاء"
              className="w-full rounded-full border border-white/[0.12] bg-[#2C2C2E]/80 py-2.5 pe-4 ps-10 text-sm text-white placeholder-white/40 transition-all focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25"
            />
          </div>

          {/* iOS 27 Segmented Control */}
          <div className="ios-segmented flex items-center gap-1 rounded-full p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              الكل ({members.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("online")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "online"
                  ? "bg-[#30D158]/25 text-[#7AE897] border border-[#30D158]/40 shadow-xs"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#30D158] animate-pulse" />
              <span>المتصلين ({onlineCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("offline")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterTab === "offline"
                  ? "bg-white/[0.14] text-white shadow-xs"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white/35" />
              <span>غير متصل ({offlineCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid or Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="ios-glass rounded-[28px] p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/[0.08] text-white/60 border border-white/[0.12]">
            <IconUsers size={28} />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            {members.length === 0 ? "أهلاً بك في عائلة الحاج متولي" : "لا توجد نتائج مطابقة"}
          </h3>
          <p className="mt-1 text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
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
              className="ios-btn-primary mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold transition-all active:scale-95"
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
                className="ios-btn-primary mt-5 inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-95"
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
                className="ios-card group flex flex-col justify-between rounded-[24px] p-4.5 transition-all duration-200 hover:border-white/[0.20] hover:bg-[#242428]/85"
              >
                {/* Header: Avatar, Online Dot, Info */}
                <div className="flex items-start gap-3.5">
                  <Link href={profileHref} className="relative shrink-0">
                    <Avatar
                      src={member.avatar_url}
                      name={member.nickname}
                      size="lg"
                      shape="rounded"
                      frameClassName="border border-white/15 bg-[#2C2C2E]"
                      fallbackClassName="text-lg font-bold text-[#409CFF]"
                    />
                    <span
                      title={isOnline ? "متصل الآن" : "غير متصل"}
                      className={`absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#1C1C1E] ${
                        isOnline ? "bg-[#30D158] shadow-[0_0_8px_#30D158]" : "bg-[#636366]"
                      }`}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        href={profileHref}
                        className="truncate font-bold text-white transition-colors group-hover:text-[#409CFF]"
                      >
                        {member.nickname}
                      </Link>
                      <GenderBadge gender={member.gender} showText={false} />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <CountryBadge country={member.country} city={member.city} />
                      {member.age && (
                        <span className="rounded-full border border-white/[0.10] bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-[#E8D5B5]">
                          {member.age} سنة
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 text-[11px] text-white/50">
                      {isOnline ? (
                        <span className="font-semibold text-[#30D158]">متصل الآن</span>
                      ) : (
                        <span>غير متصل</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio snippet if any */}
                {member.bio && (
                  <p className="mt-3 line-clamp-2 text-xs text-white/65 leading-relaxed">
                    {member.bio}
                  </p>
                )}

                {/* Action button */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
                  <Link
                    href={profileHref}
                    className="ios-btn-glass flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold text-white/90 transition-all active:scale-95"
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
