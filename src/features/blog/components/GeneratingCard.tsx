export function GeneratingCard() {
  return (
    <div
      className="blog-generating-card relative mt-5 flex h-[178px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-[#bed793] bg-white"
      role="status"
      aria-live="polite"
    >
      <span className="blog-generating-glow" aria-hidden />
      <div className="relative flex h-8 items-center gap-2" aria-hidden>
        {[0, 1, 2].map((index) => (
          <i
            key={index}
            className="blog-generating-dot h-2 w-2 rounded-full bg-[#aeca7e]"
            style={{ animationDelay: `${index * 160}ms` }}
          />
        ))}
        <span className="blog-generating-sparkle absolute -right-6 -top-1 text-[18px]">✦</span>
      </div>
      <p className="relative mt-3 text-[12px] font-medium">AI가 여행 일지를 작성하고 있어요</p>
      <p className="relative mt-3 text-[12px] text-[#596050]">방문 순서와 사진을 분석 중이에요 <span className="blog-generating-twinkle inline-block">✨</span></p>
      <div className="relative mt-4 h-[6px] w-[82%] overflow-hidden rounded-full bg-[#ecf2df]">
        <div className="blog-generating-progress h-full rounded-full bg-[linear-gradient(90deg,#a9cb78,#d9e8bd,#a9cb78)]" />
      </div>
    </div>
  );
}
