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
 * Standard top application navbar for عائلة الحاج متولي.
 * Sleek, dark mode, mobile-first design.
 */
export function AppHeader({ user, profile }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const linkClasses = (isActive: boolean, size: "sm" | "md") =>
    `rounded-xl ${
      size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-4 py-2.5 text-sm"
    } font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
      isActive
        ? "bg-coral/20 text-coral font-bold"
        : "text-[#9CB3B8] hover:bg-[#16353D] hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#20454E] bg-[#0E252D]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Brand and primary desktop links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg sm:text-xl font-black text-coral shrink-0 whitespace-nowrap transition-colors hover:text-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            عائلة الحاج متولي
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="التنقل الرئيسي" className="hidden md:flex md:items-center md:gap-1">
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
        <div className="hidden md:flex md:items-center md:gap-3">
          <PwaInstallButton />

          {user && profile ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-[#20454E] bg-[#16353D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                <span>{profile.nickname}</span>
                <GenderBadge gender={profile.gender} showText={false} />
              </Link>

              <Link
                href="/settings"
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
                  pathname === "/settings"
                    ? "bg-coral/20 text-coral"
                    : "text-[#9CB3B8] hover:bg-[#16353D] hover:text-white"
                }`}
              >
                الإعدادات
              </Link>

              <SignOutButton />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile/edit"
                className="rounded-xl bg-coral px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                إكمال الملف الشخصي
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-[#20454E] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#16353D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-coral px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
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
              className="flex items-center gap-1.5 rounded-lg border border-[#20454E] bg-[#16353D] px-2 py-1 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              <span>{profile.nickname}</span>
              <GenderBadge gender={profile.gender} showText={false} />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-[#9CB3B8] transition-colors hover:bg-[#16353D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            aria-label="القائمة الرئيسية"
            aria-expanded={mobileMenuOpen}
            aria-controls={MOBILE_MENU_ID}
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id={MOBILE_MENU_ID}
          className="mt-3 border-t border-[#20454E] pt-3 md:hidden"
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

            <div className="py-2 px-2">
              <PwaInstallButton className="w-full justify-center py-2" />
            </div>

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#9CB3B8] transition-colors hover:bg-[#16353D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  ملفي الشخصي
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={pathname === "/settings" ? "page" : undefined}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#9CB3B8] transition-colors hover:bg-[#16353D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  الإعدادات
                </Link>
                <div className="pt-2 ps-2">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-[#20454E] pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl border border-coral py-2 text-center text-sm font-bold text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-coral py-2 text-center text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
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
