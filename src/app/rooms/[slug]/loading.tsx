export default function RoomLoading() {
  return (
    <div className="flex h-screen flex-col text-white">
      <div className="ios-glass-bar flex h-14 items-center justify-between border-b px-4">
        <div className="h-5 w-32 rounded-full bg-white/10 animate-pulse" />
        <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse" />
      </div>

      <div className="flex-1 space-y-4 p-4 overflow-hidden">
        <div className="flex items-start gap-2.5 max-w-[70%]">
          <div className="h-9 w-9 rounded-full bg-white/10 shrink-0 animate-pulse" />
          <div className="h-14 w-48 rounded-[22px] bg-white/[0.08] animate-pulse" />
        </div>
        <div className="flex items-start gap-2.5 max-w-[70%] ms-auto flex-row-reverse">
          <div className="h-9 w-9 rounded-full bg-[#0A84FF]/30 shrink-0 animate-pulse" />
          <div className="h-10 w-36 rounded-[22px] bg-[#0A84FF]/25 animate-pulse" />
        </div>
        <div className="flex items-start gap-2.5 max-w-[70%]">
          <div className="h-9 w-9 rounded-full bg-white/10 shrink-0 animate-pulse" />
          <div className="h-20 w-56 rounded-[22px] bg-white/[0.08] animate-pulse" />
        </div>
      </div>

      <div className="ios-glass-bar border-t p-3">
        <div className="h-11 rounded-full bg-[#2C2C2E]/80 border border-white/10 animate-pulse" />
      </div>
    </div>
  );
}
