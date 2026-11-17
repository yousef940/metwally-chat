"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { unblockUser, type BlockedUserItem } from "@/lib/actions/safety";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";

interface BlockedUsersListProps {
  initialUsers: BlockedUserItem[];
}

export function BlockedUsersList({ initialUsers }: BlockedUsersListProps) {
  const [users, setUsers] = useState<BlockedUserItem[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUnblock = (userId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await unblockUser(userId);
      if (res.error) {
        setError(res.error);
      } else {
        setUsers((prev) => prev.filter((u) => u.blockedId !== userId));
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert tone="error" size="md" weight="normal">
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 text-center text-xs text-white/55">
          قائمة الحظر فارغة. لم تقم بحظر أي مستخدم حتى الآن.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.04]">
          {users.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={item.avatarUrl}
                  name={item.nickname}
                  size="sm"
                  fallbackClassName="text-sm font-bold text-[#409CFF]"
                />

                <div>
                  <Link
                    href={`/profile/${item.blockedId}`}
                    className="text-sm font-bold text-white transition-colors hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                  >
                    {item.nickname}
                  </Link>
                  <p className="text-[11px] text-white/50">
                    تم الحظر: {new Date(item.blockedAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUnblock(item.blockedId)}
                className="ios-btn-glass rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-all hover:border-[#0A84FF]/50 hover:text-[#409CFF] active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                إلغاء الحظر
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
