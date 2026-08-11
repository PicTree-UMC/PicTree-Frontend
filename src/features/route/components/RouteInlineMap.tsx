import { useMemo } from 'react';
import { Spinner } from '@/shared/components';
import { useKakaoMap } from '../../home/hooks/useKakaoMap';
import { useRouteDetail } from '../hooks/useRouteDetail';
import { useRoutePath } from '../hooks/useRoutePath';
import { RoutePlace } from '../types/route';

/**
 * 카드 높이. **고정이어야 한다** — 카카오맵은 컨테이너가 자기 높이를 갖고 있어야 그린다
 * (`h-full` 만 주면 부모가 0 이라 회색 타일로 남는다).
 *
 * 360px 인 이유: 장소 셋짜리 로드맵(328px)과 비슷해 피커로 갈아끼울 때 페이지가 크게
 * 출렁이지 않고, 트레이(약 100)·메타 줄(약 50)과 더해도 844px 기기에서 세로 스크롤이
 * 생기지 않는다. **여기서 더 키우지 말 것** — 페이지가 굴러가기 시작하면 지도를 끌려던
 * 손짓이 스크롤과 다툰다.
 */
const MAP_HEIGHT_PX = 360;

/** 화면 맞추기가 아래에 남길 여백. 이 지도 위에는 덮는 것이 없어 가장자리 여백이면 된다. */
const BOTTOM_PADDING_PX = 24;

/** 이 지도에는 꺼진 장소가 없다(다듬기는 전체 화면 쪽 일이다). 매 렌더 새 Set 을 만들지 않게 상수로. */
const NO_DISABLED: ReadonlySet<number> = new Set<number>();

const EMPTY_PLACES: RoutePlace[] = [];

/** 전체 화면으로(lucide:maximize-2) */
function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

/**
 * 동선 목록 안에 그리는 지도 카드 — 피커의 `지도` 칸이 로드맵 자리에 이걸 세운다.
 *
 * **좌표는 목록 응답에 없다.** `Route.places` 는 이름과 기분뿐이라(`Place` 타입) 지도를
 * 그리려면 상세(`GET /routes/{id}`)가 따로 있어야 한다. 그래서 피커를 지도로 옮긴 뒤에야
 * 요청이 나간다 — 로드맵만 보는 사람에게는 없던 요청이 늘지 않는다.
 *
 * 마커·점선·화면 맞추기는 전체 화면 지도와 **같은 훅**(`useRoutePath`)이다. 규칙(날짜별로
 * 선 끊기·겹친 마커 묶기·번호)이 두 벌로 갈리지 않게 하려는 것이고, 그래서 이 파일에는
 * 지도를 어떻게 그리는지에 대한 지식이 없다.
 *
 * **날짜 필터와 따라가기는 여기 없다.** 그 둘은 지도가 화면을 다 쓸 때 쓸모가 있는 조작이라
 * (하루로 좁혀 보고, 한 곳씩 옮겨 다닌다) 360px 카드에 욱여넣으면 지도가 남지 않는다.
 * 오른쪽 아래 버튼이 전체 화면(`/journey/view/:id`)으로 데려간다 — 그 화면으로 가는 유일한
 * 입구이기도 하다(시트의 `지도에서 보기` 줄이 이 피커로 바뀌었다).
 */
export function RouteInlineMap({ routeId, onExpand }: { routeId: number; onExpand: () => void }) {
  const { containerRef, map } = useKakaoMap();
  const { data, isLoading, isError, refetch } = useRouteDetail(routeId);

  /* ⚠️ 반드시 메모한다 — 매 렌더 새 배열이면 `useRoutePath` 의 effect 가 의존성 변화로 읽고
     렌더마다 마커를 지웠다 다시 그린다(전체 화면 쪽 `disabledPlaceIds` 와 같은 이유). */
  const places = useMemo(() => data?.places ?? EMPTY_PLACES, [data]);

  useRoutePath(map, places, NO_DISABLED, {
    dateFilter: null,
    bottomPaddingPx: BOTTOM_PADDING_PX,
  });

  return (
    <div
      className="relative overflow-hidden rounded-[16px] border border-line-soft bg-cream-sub"
      style={{ height: MAP_HEIGHT_PX }}
    >
      {/* isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를 가둬,
          아래 버튼과 상태 표시가 지도에 덮이지 않게 한다(전체 화면 지도와 같은 처리). */}
      <div ref={containerRef} className="isolate absolute inset-0" />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/70">
          <Spinner label="동선을 불러오는 중..." />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 px-8">
          <p className="text-center text-[15px] font-medium text-ink">지도를 불러오지 못했어요</p>
          <button
            onClick={() => refetch()}
            className="h-[38px] rounded-[19px] bg-pictree-700 px-6 text-[15px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 전체 화면으로. 지도를 탭해서 넘기지 않는 이유는 이 지도가 살아 있기 때문이다 —
          끌고 확대하는 자리에 탭 이동을 겹치면 손을 뗄 때마다 화면이 바뀔 수 있다.
          흰 원은 지도 위 뒤로가기 버튼과 같은 방어책이다(지형 위에서 아이콘이 묻히지 않게). */}
      {!isError && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="지도 전체 화면으로 보기"
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white text-ink shadow-[0_2px_6px_rgba(0,0,0,0.16)]"
        >
          <ExpandIcon />
        </button>
      )}
    </div>
  );
}
