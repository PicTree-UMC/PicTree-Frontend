/** 반경 안에 내 나무가 있을 때 배너가 대신 알릴 내용. */
type NearbyContent = {
  placeName: string;
  distanceM: number;
  onView: () => void;
};

type TopBannerProps = {
  placeCount: number;
  nearby?: NearbyContent | null;
};

/**
 * 홈 상단에 뜨는 안내 카드. 평소에는 "나의 여행 발자국"으로 기록한 장소 수를 보여주고,
 * 반경 50m 안에 내 나무가 있으면(`nearby`) **같은 자리에서 그 알림으로 갈아탄다.**
 *
 * 카드를 하나 더 얹지 않는 이유: 알림 카드를 따로 띄우면 이 배너 바로 아래에 놓여 지도를
 * 두 겹으로 가린다. 둘은 동시에 급하지 않으니 자리를 나눠 쓰는 편이 낫다 — 근처에 나무가
 * 있는 동안은 장소 수보다 그쪽이 할 말이 있다.
 *
 * 알림 쪽 문안은 원래 세 줄("지난 기록을 열어볼까요?"가 마지막)이었는데, 이 배너가 두 줄짜리
 * 높이라 마지막 줄은 뺐다. 그 줄이 하던 행동 유도는 오른쪽 "보기" 버튼이 대신한다.
 *
 * ⚠️ 두 상태의 **높이가 같아야 한다**(--banner-height = 60px). 위치는 `.top-banner`
 * (styles.css)이고 이 카드 아래에 놓이는 것들이 같은 변수를 보고 있어서, 한쪽만 키우면
 * 그것들이 카드 밑에 깔린다. 버튼은 h-8(32px)이라 아이콘 h-9(36px) 줄 안에 들어온다.
 */
export function TopBanner({ placeCount, nearby }: TopBannerProps) {
  return (
    <div className="top-banner absolute inset-x-4 z-30 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-lg">
        🌳
      </span>
      {/* 장소명이 길어도 버튼을 밀어내지 않게 min-w-0 + truncate 로 묶는다. */}
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[15px] font-medium text-neutral-900">
          {nearby ? '근처에 심어둔 나무가 있어요' : '나의 여행 발자국'}
        </span>
        <span className="truncate text-[13px] text-neutral-500">
          {nearby
            ? `${nearby.placeName} · 약 ${nearby.distanceM}m`
            : `${placeCount}개의 장소를 기록했어요.`}
        </span>
      </div>
      {nearby && (
        <button
          type="button"
          onClick={nearby.onView}
          /*
            GREEN-300 위 다크 텍스트 7.9:1. 알림 카드에 있던 #C5D89D 가 이 토큰이다.
            글자는 13px — 가이드 §2 의 두 기본값(13/15) 중 아래쪽이다. 흡수한 카드는 14px
            이었지만 그 중간값을 뒷받침하는 시안 근거가 없었고, 15px 로 올리면 보조 액션이
            제목 줄과 같은 무게가 된다.
          */
          className="h-8 shrink-0 rounded-xl bg-pictree-300 px-3 text-[13px] font-medium text-neutral-900"
        >
          보기
        </button>
      )}
    </div>
  );
}
