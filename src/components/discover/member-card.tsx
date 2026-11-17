import Link from "next/link";
import { GenderBadge } from "@/components/profile/gender-badge";
import { CountryBadge } from "@/components/profile/country-badge";
import { SendRequestModal } from "@/components/messages/send-request-modal";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/lib/profile";

interface MemberCardProps {
  member: Profile;
  currentUserId?: string | null;
  hasExistingConversation?: string | null;
  hasPendingRequest?: boolean;
}

export function MemberCard({
  member,
  currentUserId,
  hasExistingConversation = null,
  hasPendingRequest = false,
}: MemberCardProps) {
  const profileHref = `/profile/${member.id}`;

  return (
    <article className="ios-card ios-list-item group flex flex-col justify-between overflow-hidden rounded-[24px] p-5 transition-colors hover:border-white/[0.20] hover:bg-[#242428]">
      {/* Top Section: Avatar & Details */}
      <div>
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <Link
            href={profileHref}
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
          >
            <Avatar
              src={member.avatar_url}
              name={member.nickname}
              size="lg"
              shape="rounded"
              frameClassName="border border-white/15 bg-[#2C2C2E]"
              fallbackClassName="text-xl font-bold text-[#409CFF]"
            />
          </Link>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={profileHref}
                className="truncate font-bold text-white transition-colors hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
              >
                {member.nickname}
              </Link>
              <GenderBadge gender={member.gender} />
            </div>

            {/* Country Flag & Age */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CountryBadge country={member.country} city={member.city} />
              {member.age && (
                <span className="inline-flex items-center rounded-full border border-white/[0.10] bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-[#E8D5B5]">
                  {member.age} سنة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {member.bio ? (
          <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-white/65">
            {member.bio}
          </p>
        ) : (
          <p className="mt-3.5 text-xs italic text-white/35">
            أحد أفراد عيلة الحاج متولي.
          </p>
        )}

        {/* Interests */}
        {member.interests && member.interests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {member.interests.slice(0, 3).map((interest: string) => (
              <li
                key={interest}
                className="rounded-full border border-white/[0.10] bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/80"
              >
                #{interest}
              </li>
            ))}
            {member.interests.length > 3 && (
              <li className="self-center text-[10px] text-white/40">
                +{member.interests.length - 3}
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Bottom Section: Actions */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
        <Link
          href={profileHref}
          className="ios-btn-glass flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold text-white/90 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0A84FF]"
        >
          عرض الملف
        </Link>

        {currentUserId && currentUserId !== member.id && (
          <div className="shrink-0">
            <SendRequestModal
              receiverId={member.id}
              receiverNickname={member.nickname}
              hasExistingConversation={hasExistingConversation}
              hasPendingRequest={hasPendingRequest}
            />
          </div>
        )}
      </div>
    </article>
  );
}
