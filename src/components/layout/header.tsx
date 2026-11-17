"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { GenderBadge } from "@/components/profile/gender-badge";
import { PwaInstallButton } from "@/components/layout/pwa-install-button";
import type { Profile } from "@/lib/profile";

interface AppHeaderProps {
  user?: { id: string; email?: string } | null;
  profile?: Profile | null;
}

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/discover", label: "الأعضاء" },
  { href: "/rooms/main", label: "الدردشة الجماعية" },
  { href: "/messages", label: "الرسائل الخاصة" },
];

const MOBILE_MENU_ID = "app-header-mobile-menu";

/**
 * Top application navigation bar styled with Apple iOS & iPadOS 27 Liquid Glass.
 */
export function AppHeader({ user, profile }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const linkClasses = (isActive: boolean, size: "sm" | "md") =>
    `rounded-full ${
      size === "sm" ? "px-4 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
    } font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
      isActive
        ? "bg-white/[0.15] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] font-bold"
        : "text-white/65 hover:bg-white/[0.08] hover:text-white"
    }`;

  return (
    <header className="ios-glass-bar sticky top-0 z-40 w-full border-b px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* Brand and primary desktop links */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="bg-gradient-to-l from-white via-[#F4E8D3] to-[#409CFF] bg-clip-text text-lg sm:text-xl font-black text-transparent shrink-0 whitespace-nowrap transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          >
            عائلة الحاج متولي
          </Link>

          {/* Desktop Navigation Links inside iOS 27 Liquid Glass Capsule */}
          <nav
            aria-label="التنقل الرئيسي"
            className="ios-segmented hidden md:flex md:items-center md:gap-1 rounded-full p-1"
          >
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClasses(isActive, "sm")}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Actions */}
        <div className="hidden md:flex md:items-center md:gap-2.5">
          <PwaInstallButton />

          {user && profile ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="ios-btn-glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                <span>{profile.nickname}</span>
                <GenderBadge gender={profile.gender} showText={false} />
              </Link>

              <Link
                href="/settings"
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
                  pathname === "/settings"
                    ? "bg-[#0A84FF]/20 text-[#409CFF] border border-[#0A84FF]/35"
                    : "text-white/65 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                الإعدادات
              </Link>

              <SignOutButton />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/profile/edit"
                className="ios-btn-primary rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                إكمال الملف الشخصي
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="ios-btn-glass rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="ios-btn-primary rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <div className="flex items-center gap-2 md:hidden">
          {user && profile && (
            <Link
              href="/profile"
              className="ios-btn-glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              <span>{profile.nickname}</span>
              <GenderBadge gender={profile.gender} showText={false} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ios-btn-glass inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            aria-label="القائمة الرئيسية"
            aria-expanded={mobileMenuOpen}
            aria-controls={MOBILE_MENU_ID}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Glass Drawer */}
      {mobileMenuOpen && (
        <div
          id={MOBILE_MENU_ID}
          className="ios-glass-strong mt-3 rounded-[24px] p-3 md:hidden animate-fadeIn"
        >
          <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClasses(isActive, "md")}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="py-2 px-1">
              <PwaInstallButton className="w-full justify-center py-2" />
            </div>

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  ملفي الشخصي
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={pathname === "/settings" ? "page" : undefined}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  الإعدادات
                </Link>
                <div className="pt-2 ps-2 border-t border-white/[0.08] mt-1">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.10] pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ios-btn-glass w-full rounded-full py-2.5 text-center text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ios-btn-primary w-full rounded-full py-2.5 text-center text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
