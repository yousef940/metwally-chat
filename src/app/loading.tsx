export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Outer Glow */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-coral/20" />
        {/* Spinning Ring */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-coral/30 border-t-coral" />
      </div>
      <p className="mt-4 text-xs font-medium text-[#9CB3B8] animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}
