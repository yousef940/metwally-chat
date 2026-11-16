"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IconDeviceMobile, IconDownload } from "@/components/ui/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot() {
  return false;
}

export function PwaInstallButton({
  className = "",
  variant = "pill",
}: {
  className?: string;
  variant?: "pill" | "banner" | "button";
}) {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedByUser, setInstalledByUser] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const isInstalled = isStandalone || installedByUser;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalledByUser(true);
      }
      setDeferredPrompt(null);
    } else {
      // iOS or browser without prompt support
      setShowIosGuide(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  if (variant === "banner") {
    return (
      <div className={`rounded-2xl border border-coral/30 bg-gradient-to-r from-coral/15 to-[#16353D] p-4 text-center ${className}`}>
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:text-start">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral text-white shadow-md">
              <IconDeviceMobile size={22} className="text-white" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">تثبيت تطبيق عائلة الحاج متولي</h3>
              <p className="text-xs text-[#9CB3B8]">
                نزّل التطبيق على شاشة هاتفك الرئيسية لتصل للشات والمحادثات بضغطة واحدة!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-coral-hover active:scale-95"
          >
            <IconDownload size={16} className="text-white" />
            <span>تثبيت التطبيق الآن</span>
          </button>
        </div>

        {showIosGuide && (
          <div className="mt-3 rounded-xl border border-white/10 bg-[#0E252D] p-3 text-start text-xs text-white/90">
            <p className="font-semibold text-coral">طريقة التثبيت على الآيفون (Safari):</p>
            <p className="mt-1 text-white/80">
              اضغط على زر المشاركة أسفل الشاشة، ثم اختر <span className="font-bold text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-2 text-[11px] text-white/60 underline hover:text-white"
            >
              فهمت، إغلاق
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="تثبيت التطبيق على جهازك"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-coral/40 bg-coral/15 px-3 py-1.5 text-xs font-bold text-coral transition-colors hover:bg-coral hover:text-white focus-visible:outline-2 focus-visible:outline-coral ${className}`}
      >
        <span>📱</span>
        <span>تثبيت التطبيق</span>
      </button>

      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#20454E] bg-[#122A31] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/20 text-2xl">
              📲
            </div>
            <h3 className="text-base font-bold text-white">تثبيت التطبيق على هاتفك</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#9CB3B8]">
              لتثبيت التطبيق على شاشة هاتفك: اضغط على زر المشاركة في المتصفح ثم اختر <span className="font-bold text-white">إضافة إلى الشاشة الرئيسية ➕</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-xl bg-coral py-2 text-xs font-bold text-white hover:bg-coral-hover"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
