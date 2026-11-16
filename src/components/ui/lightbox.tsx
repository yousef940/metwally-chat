"use client";

import { useEffect } from "react";
import { IconClose, IconDownload } from "@/components/ui/icons";

interface LightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, alt = "صورة ممتدة", onClose }: LightboxProps) {
  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={src}
          download="chat-image.jpg"
          target="_blank"
          rel="noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
          title="تحميل الصورة"
          aria-label="تحميل الصورة"
        >
          <IconDownload size={20} />
        </a>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <IconClose size={20} />
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative max-h-[85vh] max-w-[95vw] overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[95vw] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
