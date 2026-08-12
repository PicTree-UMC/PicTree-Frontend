import { useRef } from 'react';

import { Skeleton } from '@/shared/components';

/** 반경 안에 내 나무가 있을 때 배너가 대신 알릴 내용. */
type NearbyContent = {
  placeName: string;
  distanceM: number;
  onView: () => void;
};

/**
 * 장소 목록을 받아 왔는가.
 *
 * ⚠️ **`placeCount` 만으로는 셋을 못 가른다.** 못 받았을 때도 0 이고 받아 봤더니 없을 때도
 * 0 이라, 이 값만 보면 화면이 "0개의 장소를 기록했어요" 라고 **단정**한다 — 불러오는 중에
 * 잠깐 그렇게 뜨고, 실패하면 그대로 굳는다(이슈 #292).
 */
type PlacesStatus = 'loading' | 'error' | 'ready';

type TopBannerProps = {
  placeCount: number;
  /** 장소 목록의 상태. `ready` 일 때만 `placeCount` 를 말한다. */
  status?: PlacesStatus;
  /** 실패했을 때 다시 받아 볼 손잡이. `status === 'error'` 에서만 쓰인다. */
  onRetry?: () => void;
  nearby?: NearbyContent | null;
  /** 오늘 하루 한도를 다 채웠는지. 아래 카메라 버튼이 흐려진 이유를 이 카드가 말한다. */
  dailyLimitReached?: boolean;
  /** 하루 한도(그루). 문구에 숫자를 박지 않으려고 받는다. */
  dailyLimit?: number;
};

/**
 * 홈 상단에 뜨는 안내 카드. 평소에는 "나의 여행 발자국"으로 기록한 장소 수를 보여주고,
 * 반경 50m 안에 내 나무가 있으면(`nearby`) **같은 자리에서 그 안내로 갈아탄다.**
 * 오늘 하루 한도를 다 채웠으면(`dailyLimitReached`) 그것도 이 자리에서 알린다.
 *
 * 카드를 하나 더 얹지 않는 이유: 안내 카드를 따로 띄우면 이 배너 바로 아래에 놓여 지도를
 * 두 겹으로 가린다. 둘은 동시에 급하지 않으니 자리를 나눠 쓰는 편이 낫다 — 근처에 나무가
 * 있는 동안은 장소 수보다 그쪽이 할 말이 있다.
 *
 * 근처 나무 쪽 문안은 원래 세 줄("지난 기록을 열어볼까요?"가 마지막)이었는데, 이 배너가
 * 두 줄짜리 높이라 마지막 줄은 뺐다. 그 줄이 하던 행동 유도는 오른쪽 "보기" 버튼이 대신한다.
 *
 * ⚠️ 두 상태의 **높이가 같아야 한다**(--banner-height = 60px). 위치는 `.top-banner`
 * (styles.css)이고 이 카드 아래에 놓이는 것들이 같은 변수를 보고 있어서, 한쪽만 키우면
 * 그것들이 카드 밑에 깔린다. 버튼은 h-8(32px)이라 아이콘 h-9(36px) 줄 안에 들어온다.
 */
export function TopBanner({
  placeCount,
  status = 'ready',
  onRetry,
  nearby,
  dailyLimitReached = false,
  dailyLimit,
}: TopBannerProps) {
  /*
    사라지는 중에도 읽을 문구가 있어야 해서 마지막 안내를 붙들어 둔다.
    `nearby` 가 null 이 되는 순간 문구까지 같이 사라지면 페이드아웃할 것이 없어
    글자가 툭 없어진다(= 애니메이션이 한쪽 방향으로만 걸린다).
  */
  const lastNearby = useRef<NearbyContent | null>(null);
  if (nearby) lastNearby.current = nearby;
  const nearbyText = nearby ?? lastNearby.current;

  /*
    세 문구 중 또렷한 것은 하나뿐이다.

    **근처 안내가 한도 안내보다 앞이다.** 순서를 뒤집으면 안 되는 이유: 한도는 그날 남은
    시간 내내 참이라, 위에 두면 한도를 채운 사람은 근처에 나무가 있어도 그 안내를 영영 못
    본다. 근처 안내는 지나가는 동안만 뜨고 누를 것(보기)이 있다 — 짧고 행동 가능한 쪽이 먼저다.
  */
  const isError = status === 'error';

  /*
    **실패가 맨 앞이다.** 목록을 못 받으면 지도에 마커가 하나도 안 찍혀서, 화면만 봐서는
    "실패" 와 "아직 아무 데도 안 갔다" 가 똑같이 생겼다. 그 둘을 갈라 주는 것이 이 자리에서
    가장 급한 말이다.

    근처 안내와 겹칠 일은 없다 — 근처 나무는 이 목록에서 골라내므로 목록이 없으면 그쪽도 없다.
    한도 안내보다는 앞이다. 한도는 카메라 버튼이 흐린 이유를 설명할 뿐이고, 그건 지도가
    비어 보이는 이유를 설명하지 못한다.
  */
  const active = isError ? 'error' : nearby ? 'nearby' : dailyLimitReached ? 'limit' : 'default';

  return (
    <div className="top-banner absolute inset-x-4 z-30 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-lg">
        🌳
      </span>
      {/*
        두 문구를 같은 칸에 겹쳐 두고 투명도로 바꿔 넣는다(banner-line, styles.css).

        조건부로 문구만 갈아끼우면 전환할 대상이 없어 애니메이션을 걸 수 없다. 겹쳐 두면
        나가는 쪽과 들어오는 쪽이 동시에 존재해 서로 넘어간다 — 나가는 쪽은 4px 내려앉으며
        흐려지고, 들어오는 쪽은 그 자리에서 4px 올라오며 또렷해진다.
        칸 높이는 둘 중 큰 쪽인데 둘 다 같은 두 줄이라 배너 높이(60px)는 그대로다.

        장소명이 길어도 버튼을 밀어내지 않게 min-w-0 + truncate 로 묶는다.
      */}
      <div className="grid min-w-0 flex-1">
        <div
          className={`banner-line col-start-1 row-start-1 flex min-w-0 flex-col leading-tight ${
            active === 'default' ? '' : 'banner-line-out'
          }`}
          aria-hidden={active !== 'default'}
        >
          <span className="truncate text-[15px] font-medium text-neutral-900">
            나의 여행 발자국
          </span>
          {/*
            아직 모르는 개수는 **막대로 자리만 잡는다.** 0 을 먼저 그려 두면 도착하는 순간
            숫자가 튀고, 그 짧은 사이에 화면이 "한 곳도 기록 안 했다" 는 거짓말을 한다.
            높이는 이 줄의 실제 높이(13px 글자, leading-tight)와 맞춘다 — 배너 높이가
            60px 로 고정이라 여기서 어긋나면 아래 것들이 카드 밑에 깔린다.
          */}
          {status === 'loading' ? (
            <Skeleton surface="card" className="mt-0.5 h-[13px] w-32 rounded" />
          ) : (
            <span className="truncate text-[13px] text-neutral-500">
              {placeCount}개의 장소를 기록했어요.
            </span>
          )}
        </div>

        {/*
          못 받았을 때. 붙들어 두지 않는다(근처 안내와 달리) — 다시 받아서 성공하면 그 문구는
          더 이상 참이 아니라, 페이드아웃으로 남겨 두면 틀린 말이 잠깐 더 보인다.
        */}
        {isError && (
          <div
            className="banner-line col-start-1 row-start-1 flex min-w-0 flex-col leading-tight"
            role="alert"
          >
            <span className="truncate text-[15px] font-medium text-neutral-900">
              장소를 불러오지 못했어요
            </span>
            <span className="truncate text-[13px] text-neutral-500">
              지도에 기록이 안 보일 수 있어요.
            </span>
          </div>
        )}

        {/*
          한도 문구는 `dailyLimitReached` 가 켜져 있는 동안만 존재한다 — 위 근처 안내와 달리
          붙들어 두지 않는다. 꺼지는 경우가 자정을 넘겼거나 나무를 지웠을 때뿐이라
          (하루에 있어도 한 번) 페이드아웃할 것을 남겨 둘 이유가 없다.
        */}
        {dailyLimitReached && (
          <div
            className={`banner-line col-start-1 row-start-1 flex min-w-0 flex-col leading-tight ${
              active === 'limit' ? '' : 'banner-line-out'
            }`}
            aria-hidden={active !== 'limit'}
          >
            <span className="truncate text-[15px] font-medium text-neutral-900">
              오늘 심을 수 있는 나무를 다 심었어요
            </span>
            <span className="truncate text-[13px] text-neutral-500">
              {dailyLimit ? `하루 ${dailyLimit}그루까지 · ` : ''}내일 다시 심을 수 있어요.
            </span>
          </div>
        )}

        {nearbyText && (
          <div
            className={`banner-line col-start-1 row-start-1 flex min-w-0 flex-col leading-tight ${
              active === 'nearby' ? '' : 'banner-line-out'
            }`}
            aria-hidden={active !== 'nearby'}
          >
            <span className="truncate text-[15px] font-medium text-neutral-900">
              근처에 심어둔 나무가 있어요
            </span>
            <span className="truncate text-[13px] text-neutral-500">
              {nearbyText.placeName} · 약 {nearbyText.distanceM}m
            </span>
          </div>
        )}
      </div>

      {/*
        오른쪽 버튼 자리도 문구와 같이 하나만 쓴다. 실패했으면 '보기' 는 누를 것이 없다 —
        보여 줄 나무가 그 못 받은 목록 안에 있었다.
      */}
      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="animate-fade-in h-8 shrink-0 rounded-xl bg-pictree-300 px-3 text-[13px] font-medium text-neutral-900"
        >
          다시 시도
        </button>
      )}

      {!isError && nearby && (
        <button
          type="button"
          onClick={nearby.onView}
          /*
            GREEN-300 위 다크 텍스트 7.9:1. 알림 카드에 있던 #C5D89D 가 이 토큰이다.
            글자는 13px — 가이드 §2 의 두 기본값(13/15) 중 아래쪽이다. 흡수한 카드는 14px
            이었지만 그 중간값을 뒷받침하는 시안 근거가 없었고, 15px 로 올리면 보조 액션이
            제목 줄과 같은 무게가 된다.

            문구가 바뀔 때 같이 나타나는 버튼이라 페이드를 맞춰 준다. 사라질 때는 그냥
            빠진다 — 누를 수 없게 된 버튼이 반투명하게 남아 있는 편이 더 이상하다.
          */
          className="animate-fade-in h-8 shrink-0 rounded-xl bg-pictree-300 px-3 text-[13px] font-medium text-neutral-900"
        >
          보기
        </button>
      )}
    </div>
  );
}
