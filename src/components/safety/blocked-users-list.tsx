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
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 text-center text-xs text-ink/60">
          قائمة الحظر فارغة. لم تقم بحظر أي مستخدم حتى الآن.
        </div>
      ) : (
        <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
          {users.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-cream/30"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={item.avatarUrl}
                  name={item.nickname}
                  size="sm"
                  fallbackClassName="text-sm font-bold text-coral"
                />

                <div>
                  <Link
                    href={`/profile/${item.blockedId}`}
                    className="text-sm font-bold text-ink transition-colors hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                  >
                    {item.nickname}
                  </Link>
                  <p className="text-[11px] text-ink/50">
                    تم الحظر: {new Date(item.blockedAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUnblock(item.blockedId)}
                className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/80 transition-colors hover:border-coral hover:bg-coral/10 hover:text-coral disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
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
