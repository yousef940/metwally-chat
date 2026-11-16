import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
    <div className="flex min-h-screen flex-col justify-between bg-[#F8F9FA] text-[#12343B]">
      <div>
        {/* Top Admin Bar */}
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                <span className="text-2xl font-black text-coral">صحبة</span>
                <span className="rounded-md bg-coral/10 px-2 py-0.5 text-xs font-bold text-coral">
                  الإدارة
                </span>
              </Link>

              {/* Navigation Tabs */}
              <nav
                aria-label="أقسام لوحة التحكم"
                className="hidden items-center gap-1 text-xs font-bold sm:flex"
              >
                <Link
                  href="/admin"
                  className="rounded-xl px-3 py-1.5 text-ink/80 transition-colors hover:bg-cream hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  📊 نظرة عامة
                </Link>
                <Link
                  href="/admin/reports"
                  className="rounded-xl px-3 py-1.5 text-ink/80 transition-colors hover:bg-cream hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  🚩 البلاغات
                </Link>
                <Link
                  href="/admin/bans"
                  className="rounded-xl px-3 py-1.5 text-ink/80 transition-colors hover:bg-cream hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  🚫 الحظر
                </Link>
                <Link
                  href="/admin/rooms"
                  className="rounded-xl px-3 py-1.5 text-ink/80 transition-colors hover:bg-cream hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  💬 الغرف
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                🏠 العودة للموقع
              </Link>
              <div className="hidden text-xs font-bold text-ink sm:block">
                {profile?.nickname || user.email}
              </div>
              <SignOutButton />
            </div>
          </div>

          {/* Mobile Navigation Sub-bar */}
          <nav
            aria-label="أقسام لوحة التحكم"
            className="mt-2.5 flex items-center justify-around border-t border-ink/5 pt-2 text-xs font-bold sm:hidden"
          >
            <Link
              href="/admin"
              className="text-ink/80 hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              الإحصائيات
            </Link>
            <Link
              href="/admin/reports"
              className="text-ink/80 hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              البلاغات
            </Link>
            <Link
              href="/admin/bans"
              className="text-ink/80 hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              الحظر
            </Link>
            <Link
              href="/admin/rooms"
              className="text-ink/80 hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              الغرف
            </Link>
          </nav>
        </header>

        {/* Admin Content Area */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>

      <footer className="border-t border-ink/10 bg-white py-6 text-center text-xs text-ink/50">
        لوحة تحكم منصة صحبة • المشرفون والإدارة
      </footer>
    </div>
  );
}
