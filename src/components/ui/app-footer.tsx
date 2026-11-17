export interface AppFooterProps {
  showLegalLinks?: boolean;
  className?: string;
}

export function AppFooter({ className = "" }: AppFooterProps) {
  return (
    <footer
      className={`mt-12 border-t border-white/[0.08] bg-black/50 backdrop-blur-xl py-6 text-center text-xs text-white/45 ${className}`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4">
        <span>© {new Date().getFullYear()} متولي شات</span>
        <span>•</span>
        <span>شات وتواصل الأصدقاء</span>
      </div>
    </footer>
  );
}
