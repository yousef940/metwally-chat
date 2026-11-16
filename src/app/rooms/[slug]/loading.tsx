export default function RoomLoading() {
  return (
    <div className="flex h-screen flex-col bg-[#0B1E24] text-[#FFF7EF]">
      {/* Top Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#20454E] bg-[#122A31] px-4">
        <div className="h-5 w-32 rounded bg-[#20454E] animate-pulse" />
        <div className="h-8 w-20 rounded-full bg-[#20454E] animate-pulse" />
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 space-y-4 p-4 overflow-hidden">
        <div className="flex items-start gap-2.5 max-w-[70%]">
          <div className="h-9 w-9 rounded-full bg-[#16353D] shrink-0 animate-pulse" />
          <div className="h-14 w-48 rounded-2xl bg-[#16353D] animate-pulse" />
        </div>
        <div className="flex items-start gap-2.5 max-w-[70%] ms-auto flex-row-reverse">
          <div className="h-9 w-9 rounded-full bg-coral/30 shrink-0 animate-pulse" />
          <div className="h-10 w-36 rounded-2xl bg-coral/20 animate-pulse" />
        </div>
        <div className="flex items-start gap-2.5 max-w-[70%]">
          <div className="h-9 w-9 rounded-full bg-[#16353D] shrink-0 animate-pulse" />
          <div className="h-20 w-56 rounded-2xl bg-[#16353D] animate-pulse" />
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="border-t border-[#20454E] bg-[#122A31] p-3">
        <div className="h-11 rounded-full bg-[#16353D] border border-[#20454E] animate-pulse" />
      </div>
    </div>
  );
}
