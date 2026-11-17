"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconHome,
  IconMessages,
  IconDirectMessage,
  IconUsers,
  IconUser,
} from "@/components/ui/icons";

export function BottomNav({ inline = false }: { inline?: boolean } = {}) {
  const pathname = usePathname() || "";
  const [unreadCount, setUnreadCount] = useState(0);

  // Track unread messages in real-time
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;

      const fetchCount = async () => {
        try {
          const { count: msgCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false)
            .neq("sender_id", uid);

          const { count: reqCount } = await supabase
            .from("chat_requests")
            .select("id", { count: "exact", head: true })
            .eq("receiver_id", uid)
            .eq("status", "pending");

          setUnreadCount((msgCount || 0) + (reqCount || 0));
        } catch {
          // silently handle network errors
        }
      };

      fetchCount();

      const channelName = `bottom_nav_unread_${uid}_${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => fetchCount()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chat_requests" },
          () => fetchCount()
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // When rendered globally in RootLayout, hide on auth screens and chat views
  // (chat views render `<BottomNav inline />` inside their full-height flex container
  // so it stays identically styled without covering the message composer).
  if (!inline) {
    if (
      pathname.includes("/rooms") ||
      (pathname.startsWith("/messages/") && pathname !== "/messages") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      return null;
    }
  }
  const navItems = [
    {
      href: "/",
      label: "الرئيسية",
      icon: IconHome,
      isActive: pathname === "/",
    },
    {
      href: "/rooms/main",
      label: "الدردشة",
      icon: IconMessages,
      isActive: pathname.startsWith("/rooms"),
    },
    {
      href: "/messages",
      label: "الرسائل",
      icon: IconDirectMessage,
      isActive: pathname.startsWith("/messages"),
    },
    {
      href: "/discover",
      label: "الأعضاء",
      icon: IconUsers,
      isActive: pathname.startsWith("/discover"),
    },
    {
      href: "/profile",
      label: "ملفي",
      icon: IconUser,
      isActive: pathname === "/profile" || pathname.startsWith("/settings"),
    },
  ];

  const capsule = (
    <nav
      aria-label="شريط التنقل السفلي"
      className="ios-glass-strong pointer-events-auto mx-auto max-w-md rounded-full px-1.5 py-1.5"
    >
      <div className="grid grid-cols-5 items-center gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center rounded-full py-1.5 px-1 transition-all duration-200 select-none active:scale-95 ${
                active
                  ? "bg-white/[0.14] text-[#409CFF] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} className={active ? "text-[#0A84FF]" : "text-white/70"} />
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF453A] px-1 text-[10px] font-black text-white ring-2 ring-[#1C1C1E]">
                    {unreadCount > 99 ? "+99" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  if (inline) {
    return (
      <div className="block md:hidden shrink-0 bg-black px-2.5 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {capsule}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 block md:hidden px-2.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      {capsule}
    </div>
  );
}
