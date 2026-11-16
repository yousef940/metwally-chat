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
  IconSettings,
} from "@/components/ui/icons";

export function BottomNav() {
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

  // Hide bottom nav inside active chat rooms, active private conversations, and auth screens
  if (
    pathname.includes("/rooms") ||
    (pathname.startsWith("/messages/") && pathname !== "/messages") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
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
      href: "/settings",
      label: "إعداداتي",
      icon: IconSettings,
      isActive: pathname.startsWith("/settings") || pathname.startsWith("/profile"),
    },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 inset-x-0 z-40 block md:hidden border-t border-[#20454E] bg-[#122A31]/95 backdrop-blur-lg pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors select-none ${
                active
                  ? "text-coral font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <div
                className={`relative flex items-center justify-center p-1.5 rounded-xl transition-all ${
                  active ? "bg-coral/15" : ""
                }`}
              >
                <Icon size={20} className={active ? "text-coral" : "text-white/70"} />
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-[#122A31] animate-pulse">
                    {unreadCount > 99 ? "+99" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
