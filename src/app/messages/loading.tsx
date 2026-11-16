export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-[#0B1E24] text-[#FFF7EF] pb-24">
      {/* Header Skeleton */}
      <div className="border-b border-[#20454E] bg-[#122A31] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="h-6 w-32 rounded-lg bg-[#20454E] animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-[#20454E] animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 space-y-3">
        {/* Tab skeleton */}
        <div className="flex gap-2 border-b border-[#20454E] pb-2">
          <div className="h-8 w-24 rounded-xl bg-[#16353D] animate-pulse" />
          <div className="h-8 w-24 rounded-xl bg-[#16353D] animate-pulse" />
        </div>

        {/* Item Skeletons */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-[#20454E] bg-[#122A31] p-3.5 animate-pulse"
          >
            <div className="h-12 w-12 rounded-full bg-[#16353D] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded bg-[#16353D]" />
                <div className="h-3 w-12 rounded bg-[#16353D]" />
              </div>
              <div className="h-3 w-48 rounded bg-[#16353D]/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
