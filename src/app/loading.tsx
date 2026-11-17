export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-[#0A84FF]/20" />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/15 border-t-[#0A84FF]" />
      </div>
      <p className="mt-4 text-xs font-medium text-white/55 animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}
