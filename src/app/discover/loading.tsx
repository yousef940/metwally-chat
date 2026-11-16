export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-[#0B1E24] text-[#FFF7EF] pb-24">
      <div className="border-b border-[#20454E] bg-[#122A31] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="h-6 w-32 rounded-lg bg-[#20454E] animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-[#20454E] animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-12 w-full rounded-2xl bg-[#122A31] border border-[#20454E] animate-pulse" />

        {/* Member Grid Skeletons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-2xl border border-[#20454E] bg-[#122A31] p-4 animate-pulse space-y-3"
            >
              <div className="h-16 w-16 rounded-full bg-[#16353D]" />
              <div className="h-4 w-24 rounded bg-[#16353D]" />
              <div className="h-3 w-16 rounded bg-[#16353D]/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
