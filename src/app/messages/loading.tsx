export default function MessagesLoading() {
  return (
    <div className="min-h-screen text-white pb-28">
      <div className="ios-glass-bar border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="h-6 w-32 rounded-full bg-white/10 animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-4">
        <div className="ios-segmented inline-flex gap-1 rounded-full p-1">
          <div className="h-8 w-28 rounded-full bg-white/15 animate-pulse" />
          <div className="h-8 w-28 rounded-full bg-white/[0.06] animate-pulse" />
        </div>

        <div className="ios-card overflow-hidden rounded-[24px] divide-y divide-white/[0.08]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3.5 p-4 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 rounded-full bg-white/10" />
                  <div className="h-3 w-12 rounded-full bg-white/[0.07]" />
                </div>
                <div className="h-3 w-48 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
