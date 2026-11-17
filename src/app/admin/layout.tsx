import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  IconChartBar,
  IconFlag,
  IconBan,
  IconMessages,
  IconHome,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "لوحة التحكم والمشرفين - صحبة",
  description: "لوحة تحكم إدارة منصة صحبة ومتابعة البلاغات والحظر والغرف",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col justify-between text-white">
      <div>
        {/* Top Admin Bar — iOS 27 Liquid Glass */}
        <header className="ios-glass-bar sticky top-0 z-40 border-b px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                <span className="bg-gradient-to-l from-white via-[#F4E8D3] to-[#409CFF] bg-clip-text text-2xl font-black text-transparent">صحبة</span>
                <span className="rounded-full border border-[#0A84FF]/35 bg-[#0A84FF]/15 px-2.5 py-0.5 text-xs font-bold text-[#409CFF]">
                  الإدارة
                </span>
              </Link>

              {/* Navigation Tabs */}
              <nav
                aria-label="أقسام لوحة التحكم"
                className="ios-segmented hidden items-center gap-1 rounded-full p-1 text-xs font-bold sm:flex"
              >
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  <IconChartBar size={14} />
                  <span>نظرة عامة</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  <IconFlag size={14} />
                  <span>البلاغات</span>
                </Link>
                <Link
                  href="/admin/bans"
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  <IconBan size={14} />
                  <span>الحظر</span>
                </Link>
                <Link
                  href="/admin/rooms"
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white/75 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  <IconMessages size={14} />
                  <span>الغرف</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="ios-btn-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                <IconHome size={14} />
                <span>العودة للموقع</span>
              </Link>
              <div className="hidden text-xs font-bold text-white sm:block">
                {profile?.nickname || user.email}
              </div>
              <SignOutButton />
            </div>
          </div>

          {/* Mobile Navigation Sub-bar */}
          <nav
            aria-label="أقسام لوحة التحكم"
            className="mt-2.5 flex items-center justify-around border-t border-white/[0.08] pt-2 text-xs font-bold sm:hidden"
          >
            <Link
              href="/admin"
              className="text-white/75 hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              الإحصائيات
            </Link>
            <Link
              href="/admin/reports"
              className="text-white/75 hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              البلاغات
            </Link>
            <Link
              href="/admin/bans"
              className="text-white/75 hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              الحظر
            </Link>
            <Link
              href="/admin/rooms"
              className="text-white/75 hover:text-[#409CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              الغرف
            </Link>
          </nav>
        </header>

        {/* Admin Content Area */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>

      <footer className="border-t border-white/[0.08] bg-black/50 backdrop-blur-xl py-6 text-center text-xs text-white/45">
        لوحة تحكم منصة صحبة • المشرفون والإدارة
      </footer>
    </div>
  );
}
