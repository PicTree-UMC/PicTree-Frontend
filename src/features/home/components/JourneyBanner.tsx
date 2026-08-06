type JourneyBannerProps = {
  placeCount: number;
};

/**
 * 홈 상단에 뜨는 "나의 여행 발자국" 안내 카드. 기록한 장소 수만 보여주는 정보 카드다.
 *
 * 위치는 `.top-banner`(styles.css). ⚠️ 여기 값을 직접 쓰지 말 것 — 이 카드 아래에
 * 놓이는 요소들이 같은 변수를 보고 있어서, 여기만 움직이면 그것들이 카드 밑에 깔린다.
 */
export function JourneyBanner({ placeCount }: JourneyBannerProps) {
  return (
    <div className="top-banner absolute inset-x-4 z-30 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-lg">
        🌳
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-medium text-neutral-900">나의 여행 발자국</span>
        <span className="text-[13px] text-neutral-500">{placeCount}개의 장소를 기록했어요.</span>
      </div>
    </div>
  );
}
