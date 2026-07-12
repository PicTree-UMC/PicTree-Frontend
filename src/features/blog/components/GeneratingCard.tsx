export function GeneratingCard() {
  return (
    <div className="mt-5 flex h-[178px] flex-col items-center justify-center rounded-xl border-2 border-[#bed793] bg-white">
      <div className="flex items-end gap-2"><i className="h-2 w-2 rounded-full bg-[#bed793]"/><i className="mb-2 h-2 w-2 rounded-full bg-[#bed793]"/><i className="mb-3 h-2 w-2 rounded-full bg-[#bed793]"/></div>
      <p className="mt-8 text-[12px]">AI가 여행 일지를 작성하고 있어요</p>
      <p className="mt-3 text-[12px]">방문 순서와 사진을 분석 중이에요 ✨</p>
      <div className="mt-4 h-[6px] w-[82%] overflow-hidden rounded-full bg-[#ecf2df]"><div className="h-full w-3/4 animate-pulse rounded-full bg-[#b9d48a]"/></div>
    </div>
  );
}
