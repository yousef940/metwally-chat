export default function DiscoverLoading() {
  return (
    <div className="min-h-screen text-white pb-28">
      <div className="ios-glass-bar border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="h-6 w-32 rounded-full bg-white/10 animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-4">
        <div className="ios-card h-14 w-full rounded-[24px] animate-pulse" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="ios-card flex flex-col items-center rounded-[24px] p-4 animate-pulse space-y-3"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/10" />
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-3 w-16 rounded-full bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
