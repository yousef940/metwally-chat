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
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#20454E] bg-[#122A31] p-5 shadow-sm transition-all hover:border-coral/50 hover:bg-[#16353D]">
      {/* Top Section: Avatar & Details */}
      <div>
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <Link
            href={profileHref}
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-coral"
          >
            <Avatar
              src={member.avatar_url}
              name={member.nickname}
              size="lg"
              shape="rounded"
              frameClassName="border-2 border-[#20454E] bg-[#16353D]"
              fallbackClassName="text-xl font-bold text-coral"
            />
          </Link>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={profileHref}
                className="truncate font-bold text-white transition-colors hover:text-coral focus-visible:outline-2 focus-visible:outline-coral"
              >
                {member.nickname}
              </Link>
              <GenderBadge gender={member.gender} />
            </div>

            {/* Country Flag & Age */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CountryBadge country={member.country} city={member.city} />
              {member.age && (
                <span className="inline-flex items-center rounded-lg border border-[#20454E] bg-[#16353D] px-2 py-0.5 text-xs font-bold text-coral">
                  {member.age} سنة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {member.bio ? (
          <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-[#9CB3B8]">
            {member.bio}
          </p>
        ) : (
          <p className="mt-3.5 text-xs italic text-white/30">
            أحد أفراد عيلة الحاج متولي.
          </p>
        )}

        {/* Interests */}
        {member.interests && member.interests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {member.interests.slice(0, 3).map((interest: string) => (
              <li
                key={interest}
                className="rounded-lg border border-[#20454E] bg-[#0E252D] px-2 py-0.5 text-[11px] font-medium text-white/80"
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
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#20454E] pt-3">
        <Link
          href={profileHref}
          className="flex-1 rounded-xl border border-[#20454E] bg-[#0E252D] px-3 py-2 text-center text-xs font-semibold text-white/90 transition-colors hover:border-coral/40 hover:bg-[#16353D] hover:text-white focus-visible:outline-2 focus-visible:outline-coral"
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
