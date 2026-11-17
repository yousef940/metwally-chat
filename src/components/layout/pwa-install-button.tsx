"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { IconDeviceMobile, IconDownload, IconShareIos, IconPlus } from "@/components/ui/icons";

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
      <div className={`ios-glass rounded-[24px] p-4 text-center ${className}`}>
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:text-start">
          <div className="flex items-center gap-3.5">
            <span className="ios-btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
              <IconDeviceMobile size={22} className="text-white" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">تثبيت تطبيق عائلة الحاج متولي</h3>
              <p className="text-xs text-white/60 mt-0.5">
                نزّل التطبيق على شاشة هاتفك الرئيسية لتصل للشات والمحادثات بضغطة واحدة!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="ios-btn-primary inline-flex shrink-0 items-center gap-2 rounded-full px-4.5 py-2.5 text-xs font-bold transition-all active:scale-95"
          >
            <IconDownload size={16} className="text-white" />
            <span>تثبيت التطبيق الآن</span>
          </button>
        </div>

        {showIosGuide && (
          <div className="mt-3 rounded-2xl border border-white/[0.10] bg-black/45 p-3.5 text-start text-xs text-white/90">
            <p className="font-semibold text-[#409CFF]">طريقة التثبيت على الآيفون (Safari):</p>
            <p className="mt-1 text-white/75">
              اضغط على زر المشاركة أسفل الشاشة، ثم اختر <span className="font-bold text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-2 text-[11px] text-white/55 underline hover:text-white"
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
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#0A84FF]/35 bg-[#0A84FF]/15 px-3.5 py-1.5 text-xs font-bold text-[#409CFF] backdrop-blur-xl transition-all hover:bg-[#0A84FF] hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0A84FF] ${className}`}
      >
        <IconDeviceMobile size={15} />
        <span>تثبيت التطبيق</span>
      </button>

      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn"
        >
          <div className="ios-glass-strong w-full max-w-sm rounded-[30px] p-6 text-center animate-slideUp">
            <div className="mx-auto mb-3 ios-grabber" aria-hidden="true" />
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0A84FF]/20 border border-[#0A84FF]/30 text-[#409CFF]">
              <IconDeviceMobile size={28} />
            </div>
            <h3 className="text-base font-bold text-white">تثبيت التطبيق على هاتفك</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              لتثبيت التطبيق على شاشة هاتفك: اضغط على زر المشاركة{" "}
              <IconShareIos size={14} className="inline align-text-bottom text-[#409CFF]" />{" "}
              في المتصفح ثم اختر{" "}
              <span className="font-bold text-white">
                إضافة إلى الشاشة الرئيسية{" "}
                <IconPlus size={12} className="inline align-text-bottom text-[#409CFF]" />
              </span>.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="ios-btn-primary mt-5 w-full rounded-full py-2.5 text-xs font-bold active:scale-95"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
