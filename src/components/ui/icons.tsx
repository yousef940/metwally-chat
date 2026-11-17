import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Apple iOS & iPadOS 27 — SF Symbols inspired vector icon set.
 * Designed with optical balance, continuous rounded strokes, and crisp fills
 * so icons render identically to iPhone/iOS across all platforms (including Windows).
 */

/* house.fill */
export function IconHome({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M11.3 2.55a1.1 1.1 0 0 1 1.4 0l8.5 7.18a1.05 1.05 0 0 1-.68 1.85h-1.27v8.12A2.3 2.3 0 0 1 16.95 22h-2.7a.8.8 0 0 1-.8-.8v-4.65a1.45 1.45 0 0 0-2.9 0v4.65a.8.8 0 0 1-.8.8h-2.7a2.3 2.3 0 0 1-2.3-2.3v-8.12H3.48a1.05 1.05 0 0 1-.68-1.85l8.5-7.18Z" />
    </svg>
  );
}

/* bubble.left.and.bubble.right.fill */
export function IconMessages({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M15.4 3H6.6C4.06 3 2 4.86 2 7.15v4.35c0 1.42.8 2.67 2.02 3.41-.14.84-.54 1.62-1.1 2.22a.55.55 0 0 0 .42.92c1.43-.04 2.72-.52 3.63-1.2.47.08.95.12 1.45.12h.58V13.6c0-2.55 2.2-4.6 4.95-4.6h3.95V7.15C17.9 4.86 17.94 3 15.4 3Z" opacity="0.82" />
      <path d="M17.5 10.2h-4.1c-2.2 0-4 1.64-4 3.68v2.64c0 2.04 1.8 3.68 4 3.68.42 0 .83-.06 1.22-.17.78.57 1.87.97 3.06 1a.45.45 0 0 0 .35-.76 3.55 3.55 0 0 1-.92-1.84c1.05-.64 1.74-1.72 1.74-2.96v-1.59c0-2.04-1.15-3.68-3.35-3.68h2Z" />
    </svg>
  );
}

/* message.fill (Apple Messages bubble) */
export function IconDirectMessage({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M12 3C6.75 3 2.5 6.72 2.5 11.3c0 2.13.92 4.07 2.43 5.54-.21 1.38-.82 2.62-1.66 3.45a.58.58 0 0 0 .42.99c2.12-.06 4.08-.77 5.45-1.87.91.22 1.87.34 2.86.34 5.25 0 9.5-3.72 9.5-8.45S17.25 3 12 3Z" />
    </svg>
  );
}

/* person.2.fill */
export function IconUsers({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <circle cx="9.2" cy="7.4" r="3.6" />
      <path d="M9.2 12.6c-3.85 0-6.95 2.18-6.95 5.15 0 1.08.84 1.75 1.95 1.75h10c1.11 0 1.95-.67 1.95-1.75 0-2.97-3.1-5.15-6.95-5.15Z" />
      <circle cx="16.8" cy="8.5" r="2.75" opacity="0.72" />
      <path d="M17.2 13.1c2.78.28 4.8 1.9 4.8 4.25 0 .92-.68 1.55-1.62 1.55h-2.83c.17-.42.25-.88.25-1.38 0-1.85-.82-3.4-2.16-4.42h1.56Z" opacity="0.72" />
    </svg>
  );
}

/* person.crop.circle.fill */
export function IconUser({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.615 2.25 2.25 6.615 2.25 12S6.615 21.75 12 21.75 21.75 17.385 21.75 12 17.385 2.25 12 2.25Zm0 3.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Zm-5.73 11.42A7.73 7.73 0 0 0 12 19.75c2.28 0 4.33-.98 5.73-2.33-.92-1.88-3.09-3.07-5.73-3.07s-4.81 1.19-5.73 3.07Z" />
    </svg>
  );
}

/* gearshape.fill */
export function IconSettings({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.45 2.52a1.65 1.65 0 0 1 3.1 0l.35 1.07a1.5 1.5 0 0 0 1.98.91l1.03-.45a1.65 1.65 0 0 1 2.2 2.2l-.45 1.03a1.5 1.5 0 0 0 .91 1.98l1.07.35a1.65 1.65 0 0 1 0 3.1l-1.07.35a1.5 1.5 0 0 0-.91 1.98l.45 1.03a1.65 1.65 0 0 1-2.2 2.2l-1.03-.45a1.5 1.5 0 0 0-1.98.91l-.35 1.07a1.65 1.65 0 0 1-3.1 0l-.35-1.07a1.5 1.5 0 0 0-1.98-.91l-1.03.45a1.65 1.65 0 0 1-2.2-2.2l.45-1.03a1.5 1.5 0 0 0-.91-1.98l-1.07-.35a1.65 1.65 0 0 1 0-3.1l1.07-.35a1.5 1.5 0 0 0 .91-1.98l-.45-1.03a1.65 1.65 0 0 1 2.2-2.2l1.03.45a1.5 1.5 0 0 0 1.98-.91l.35-1.07ZM12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
    </svg>
  );
}

/* rectangle.portrait.and.arrow.right */
export function IconLogOut({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M10 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H10" />
      <path d="M15.5 8.25 19.25 12l-3.75 3.75" />
      <path d="M19 12H9.5" />
    </svg>
  );
}

/* arrow.up (Iconic iMessage Send Arrow) */
export function IconSend({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M12 19V5.5" />
      <path d="M6.25 11.25 12 5.5l5.75 5.75" />
    </svg>
  );
}

/* magnifyingglass */
export function IconSearch({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="10.75" cy="10.75" r="7" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

/* camera.fill */
export function IconCamera({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M9.2 4.5c.4-.58 1.05-.95 1.76-.95h2.08c.71 0 1.36.37 1.76.95l.88 1.3h2.57A3.25 3.25 0 0 1 21.5 9.05v8.2a3.25 3.25 0 0 1-3.25 3.25H5.75a3.25 3.25 0 0 1-3.25-3.25v-8.2A3.25 3.25 0 0 1 5.75 5.8h2.57l.88-1.3ZM12 9.25a3.85 3.85 0 1 0 0 7.7 3.85 3.85 0 0 0 0-7.7Z" />
    </svg>
  );
}

/* arrowshape.turn.up.left.fill */
export function IconReply({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M10.45 5.2a.85.85 0 0 0-1.45-.6L3.1 10.5a1.15 1.15 0 0 0 0 1.62l5.9 5.9a.85.85 0 0 0 1.45-.6v-3.2c4.35 0 7.45 1.18 9.6 4.02.35.46 1.08.16.97-.42-.94-4.97-4.18-8.88-10.57-9.47V5.2Z" />
    </svg>
  );
}

/* checkmark */
export function IconCheck({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="m4.75 12.75 4.75 4.75 9.75-10.5" />
    </svg>
  );
}

/* xmark */
export function IconClose({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M17.5 6.5 6.5 17.5" />
      <path d="m6.5 6.5 11 11" />
    </svg>
  );
}

/* shield.lefthalf.filled */
export function IconShield({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M12 2.75 4.75 5.65v5.6c0 4.92 3.12 8.78 7.25 10 4.13-1.22 7.25-5.08 7.25-10v-5.6L12 2.75Z" />
      <path d="M12 2.75v18.5c-4.13-1.22-7.25-5.08-7.25-10v-5.6L12 2.75Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

/* circle.fill */
export function IconCircle({ size = 10, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

/* iphone (iPhone with Dynamic Island + Home Indicator — replaces Windows 📱 emoji!) */
export function IconDeviceMobile({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3.2" />
      <rect x="9.75" y="4.25" width="4.5" height="1.25" rx="0.625" fill="currentColor" stroke="none" />
      <line x1="9.75" y1="19.2" x2="14.25" y2="19.2" strokeWidth="1.6" />
    </svg>
  );
}

/* square.and.arrow.down (iOS Download / Install) */
export function IconDownload({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M12 3.25v11.5" />
      <path d="m8.25 11.25 3.75 3.75 3.75-3.75" />
      <path d="M5.5 11.75v6.5A2.5 2.5 0 0 0 8 20.75h8a2.5 2.5 0 0 0 2.5-2.5v-6.5" />
    </svg>
  );
}

/* square.and.arrow.up (iOS Safari Share) */
export function IconShareIos({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M12 14.5V3.25" />
      <path d="M8.25 6.75 12 3l3.75 3.75" />
      <path d="M6 10.5h-.5A1.5 1.5 0 0 0 4 12v7.25A1.75 1.75 0 0 0 5.75 21h12.5A1.75 1.75 0 0 0 20 19.25V12a1.5 1.5 0 0 0-1.5-1.5H18" />
    </svg>
  );
}

/* plus */
export function IconPlus({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/* doc.on.doc */
export function IconCopy({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect x="8.5" y="7.5" width="11.5" height="13.5" rx="2.5" />
      <path d="M15.5 7.5V5.5A2.5 2.5 0 0 0 13 3H6.5A2.5 2.5 0 0 0 4 5.5v9A2.5 2.5 0 0 0 6.5 17H8.5" />
    </svg>
  );
}

/* photo.on.rectangle */
export function IconImage({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3.2" />
      <circle cx="8.75" cy="9.25" r="1.6" fill="currentColor" stroke="none" />
      <path d="m20.5 15.8-4.4-4.4a1.6 1.6 0 0 0-2.26 0L6.5 18.75" />
    </svg>
  );
}

/* face.smiling */
export function IconSmile({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <circle cx="9" cy="10" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.15" fill="currentColor" stroke="none" />
      <path d="M8.5 14.3c.85 1.45 2.15 2.2 3.5 2.2s2.65-.75 3.5-2.2" />
    </svg>
  );
}

/* flag.fill (SF Symbol Report) */
export function IconFlag({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M5.75 3a.9.9 0 0 1 .9.9v.72c1.25-.72 2.95-1.17 4.75-.72 1.8.45 3.1 1.2 4.75.88 1.25-.24 2.12-.77 2.55-1.08a.85.85 0 0 1 1.35.69v9.15a1.1 1.1 0 0 1-.46.9c-.74.52-1.88 1.13-3.44 1.36-1.95.29-3.45-.45-5.15-.87-1.48-.36-2.92-.12-4.35.67v5.5a.9.9 0 1 1-1.8 0V3.9a.9.9 0 0 1 .9-.9Z" />
    </svg>
  );
}

/* nosign (SF Symbol Block / Ban) */
export function IconBan({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m5.8 5.8 12.4 12.4" />
    </svg>
  );
}

/* bell.fill */
export function IconBell({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M12 2.5a1.25 1.25 0 0 1 1.25 1.25v.44a6.25 6.25 0 0 1 5 6.12v3.62c0 .88.32 1.73.9 2.39l.63.72a1 1 0 0 1-.75 1.66H4.97a1 1 0 0 1-.75-1.66l.63-.72c.58-.66.9-1.51.9-2.39v-3.62a6.25 6.25 0 0 1 5-6.12v-.44A1.25 1.25 0 0 1 12 2.5Zm-2.35 17.45h4.7a2.4 2.4 0 0 1-4.7 0Z" />
    </svg>
  );
}

/* bell.slash.fill */
export function IconBellSlash({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M8.7 5.25A5.75 5.75 0 0 1 17.75 10v3.5c0 .7.2 1.38.57 1.97" />
      <path d="M6.25 10.5v3.1c0 .9-.33 1.76-.92 2.44l-.6.68a.75.75 0 0 0 .56 1.25h10.2" />
      <path d="M9.75 20a2.35 2.35 0 0 0 4.5 0" />
      <path d="M3.5 3.5 20.5 20.5" />
    </svg>
  );
}

/* pin.fill */
export function IconPin({ size = 15, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M15.4 3.4a1.2 1.2 0 0 1 1.7 0l3.5 3.5a1.2 1.2 0 0 1-.35 1.94l-2.55 1.15-2.6 2.6.58 3.22a1 1 0 0 1-1.69.89l-3.36-3.36-5.6 5.6a.9.9 0 0 1-1.27-1.27l5.6-5.6-3.36-3.36a1 1 0 0 1 .89-1.69l3.22.58 2.6-2.6 1.15-2.55a1.2 1.2 0 0 1 .24-.35Z" />
    </svg>
  );
}

/* lock.fill */
export function IconLock({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 9V7.25a4.5 4.5 0 1 1 9 0V9h.75A2.75 2.75 0 0 1 20 11.75v7A2.75 2.75 0 0 1 17.25 21.5H6.75A2.75 2.75 0 0 1 4 18.75v-7A2.75 2.75 0 0 1 6.75 9H7.5Zm2-1.75V9h5V7.25a2.5 2.5 0 0 0-5 0Z" />
    </svg>
  );
}

/* lock.open.fill */
export function IconUnlock({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M16.5 4.5a2.5 2.5 0 0 0-5 0V9h5.75A2.75 2.75 0 0 1 20 11.75v7a2.75 2.75 0 0 1-2.75 2.75H6.75A2.75 2.75 0 0 1 4 18.75v-7A2.75 2.75 0 0 1 6.75 9H9.5V4.5a4.5 4.5 0 0 1 8.85-1.1.95.95 0 1 1-1.85.46c-.08-.34-.22-.64-.45-.86.28.4.45.92.45 1.5Z" />
    </svg>
  );
}

/* mappin.and.ellipse */
export function IconMapPin({ size = 15, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M12 2.5a6.75 6.75 0 0 0-6.75 6.75c0 4.68 5.45 10.65 6.13 11.38a.85.85 0 0 0 1.24 0c.68-.73 6.13-6.7 6.13-11.38A6.75 6.75 0 0 0 12 2.5Zm0 9.15a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z" />
    </svg>
  );
}

/* wifi.slash */
export function IconWifiSlash({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M2.75 9.25a13.7 13.7 0 0 1 5.05-3.05" />
      <path d="M11.6 5.65c3.48-.12 6.99 1.07 9.65 3.6" />
      <path d="M5.9 12.6a9.35 9.35 0 0 1 4.15-2.08" />
      <path d="M15.1 10.85a9.3 9.3 0 0 1 3 1.75" />
      <path d="M9.1 15.85a4.8 4.8 0 0 1 5.8 0" />
      <circle cx="12" cy="19.1" r="1.25" fill="currentColor" stroke="none" />
      <path d="M3.5 3.5 20.5 20.5" />
    </svg>
  );
}

/* arrow.clockwise */
export function IconRefresh({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.7" />
      <path d="M20 4.2v4.5h-4.5" />
    </svg>
  );
}

/* trash.fill */
export function IconTrash({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M9.25 3.5A1.75 1.75 0 0 1 11 1.75h2a1.75 1.75 0 0 1 1.75 1.75V5h4a.9.9 0 1 1 0 1.8h-.8l-.9 12.35A2.75 2.75 0 0 1 14.3 21.7H9.7a2.75 2.75 0 0 1-2.75-2.55L6.05 6.8h-.8a.9.9 0 1 1 0-1.8h4V3.5Zm1.75 0V5h2V3.5h-2Z" />
    </svg>
  );
}

/* clock.fill */
export function IconClock({ size = 15, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.615 2.25 2.25 6.615 2.25 12S6.615 21.75 12 21.75 21.75 17.385 21.75 12 17.385 2.25 12 2.25Zm.9 4.5a.9.9 0 0 0-1.8 0v5.25c0 .3.15.58.4.75l3.35 2.25a.9.9 0 1 0 1-1.5l-2.95-1.97V6.75Z" />
    </svg>
  );
}

/* chart.bar.fill */
export function IconChartBar({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <rect x="3.5" y="12.5" width="4.2" height="8" rx="1.4" />
      <rect x="9.9" y="7.5" width="4.2" height="13" rx="1.4" />
      <rect x="16.3" y="3.5" width="4.2" height="17" rx="1.4" />
    </svg>
  );
}

/* slider.horizontal.3 */
export function IconSliders({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M4 7h16" />
      <circle cx="9" cy="7" r="2.1" fill="currentColor" />
      <path d="M4 12h16" />
      <circle cx="15.5" cy="12" r="2.1" fill="currentColor" />
      <path d="M4 17h16" />
      <circle cx="10.5" cy="17" r="2.1" fill="currentColor" />
    </svg>
  );
}

/* checkmark.seal.fill */
export function IconCheckSeal({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm4.28 7.97a.95.95 0 0 0-1.36-1.33l-4.07 4.18-1.77-1.77a.95.95 0 1 0-1.34 1.34l2.45 2.45a.95.95 0 0 0 1.35 0l4.74-4.87Z" />
    </svg>
  );
}

/* Male SF Symbol */
export function IconMale({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="10" cy="14" r="5.25" />
      <path d="M13.8 10.2 19.25 4.75" />
      <path d="M14.75 4.75h4.5v4.5" />
    </svg>
  );
}

/* Female SF Symbol */
export function IconFemale({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="9.5" r="5.25" />
      <path d="M12 14.75v6.25" />
      <path d="M9.25 18.25h5.5" />
    </svg>
  );
}
