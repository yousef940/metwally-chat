"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name of the dialog, also used as the visible heading. */
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Optional decoration shown before the title (an emoji or a small badge). */
  icon?: ReactNode;
  /** Extra classes for the heading. */
  titleClassName?: string;
  /** Shows the close button in the header. */
  showCloseButton?: boolean;
  /** Accessible name of the close button. */
  closeLabel?: string;
  /** Extra classes for the dialog panel. */
  panelClassName?: string;
  /** Extra classes for the content area under the header. */
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Accessible dialog shared by every modal in the app.
 *
 * It handles the behaviour that hand written dialogs usually miss:
 * `role="dialog"` + `aria-modal`, an accessible name, Escape to close,
 * click on the backdrop to close, focus moved into the dialog on open,
 * focus restored to the trigger on close, and Tab kept inside the dialog.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  titleClassName = "text-base font-bold text-ink",
  showCloseButton = false,
  closeLabel = "إغلاق",
  panelClassName = "",
  bodyClassName = "",
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const subtitleId = useId();

  // Keep the latest callback without re-running the focus effect on every render.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(
      FOCUSABLE_SELECTOR
    );
    (firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusableItems = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);

      if (focusableItems.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusableItems[0];
      const last = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        className={`w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl outline-none ${panelClassName}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h2 id={titleId} className={titleClassName}>
                {title}
              </h2>
              {subtitle && (
                <p id={subtitleId} className="text-xs text-ink/60">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
