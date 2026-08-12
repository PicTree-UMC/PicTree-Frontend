import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRouteDetail } from './useRouteDetail';
import { useRoutePlaceCandidates } from './useRoutePlaceCandidates';
import { DATES_PARAM, parseDatesParam } from '../lib/routeParams';
import { RouteDetail, RoutePlace } from '../types/route';

export interface RouteViewPlaces {
  /** ② 저장된 동선 보기 모드인가. 되돌아갈 곳·제목·시트의 읽기 전용 여부가 여기서 갈린다. */
  isSavedView: boolean;
  /** 앞 단계에서 고른 날짜. 형식·중복·개수는 파서가 이미 걸러낸다. ② 에서는 비어 있다. */
  pickedDates: string[];
  /** ② 의 동선 1건. ① 에서는 `undefined` — 제목이 여기서 온다. */
  routeDetail: RouteDetail | undefined;
  /** 화면이 그릴 장소 전부(꺼둔 것 포함). 뒤따르는 로직은 출처를 모른 채 이것만 본다. */
  places: RoutePlace[];
  /** 칩 줄에 늘어놓을 날짜. */
  dates: string[];
  isLoading: boolean;
  isError: boolean;
  isOffline: boolean;
  refetch: () => void;
}

/**
 * 지도 화면이 그릴 장소를 URL 에서 길어 온다.
 *
 * **두 모드가 갈리는 자리가 여기 하나다.** 끄기·번호 재순서화·마커 묶음(화면설계서 6·7·9번)은
 * `RoutePlace[]` 만 보므로, 이 훅 밖으로 나가면 어느 모드인지 알 필요가 없어진다.
 *
 * | | ① 새 동선 만들기 `/journey/view?dates=` | ② 저장된 동선 보기 `/journey/view/:routeId` |
 * |---|---|---|
 * | 출처 | `GET /trees` 중 쿼리로 받은 날짜 | `GET /routes/{id}` 한 번 |
 * | 날짜 칩 | 앞 단계에서 고른 것 | 동선이 걸친 날짜에서 도출 |
 *
 * `isSavedView` 를 함께 내놓는 건 **화면 구성이 아직 모드를 알아야 하기 때문**이다
 * (② 는 시트가 읽기 전용이고 `다음` 이 없다) — 장소를 다루는 로직이 아니라 배치의 문제라
 * 페이지에 남겨 둔다.
 */
export function useRouteViewPlaces(): RouteViewPlaces {
  const [searchParams] = useSearchParams();

  // URL 에 id 가 있으면 ② 모드. 손으로 친 주소가 들어올 수 있어 숫자인지까지 본다.
  const { routeId: routeIdParam } = useParams();
  const parsedRouteId = Number(routeIdParam);
  const routeId = routeIdParam && Number.isInteger(parsedRouteId) ? parsedRouteId : undefined;
  const isSavedView = routeId !== undefined;

  // 두 모드가 각자 다른 곳에서 장소를 받는다. 쓰지 않는 쪽은 훅 안에서 요청이 꺼진다.
  const detailQuery = useRouteDetail(routeId);
  const candidatesQuery = useRoutePlaceCandidates(!isSavedView);
  const source = isSavedView ? detailQuery : candidatesQuery;
  const routeDetail = detailQuery.data;
  const { isLoading, isError, refetch } = source;

  /**
   * 네트워크가 끊겨 요청이 멈춘 상태. **로딩도 에러도 아니다** — react-query 는 오프라인이면
   * 재시도를 미뤄두고 `fetchStatus:'paused'` 로 앉아 있으므로, 따로 안 그리면 화면이
   * '제목 없는 빈 지도'로 굳는다(2026-07-31 실측). 연결이 돌아오면 알아서 이어서 받는다.
   */
  const isOffline = source.isPaused && source.data === undefined;

  /** 앞 단계에서 고른 날짜. 형식·중복·개수는 파서가 이미 걸러낸다. ② 에서는 쓰이지 않는다. */
  const pickedDates = useMemo(() => parseDatesParam(searchParams.get(DATES_PARAM)), [searchParams]);

  /** ① 에서 고를 수 있는 장소 전부(방문 기록이 있는 것만). ② 에서는 비어 있다. */
  const candidates = useMemo(() => candidatesQuery.data ?? [], [candidatesQuery.data]);

  /** 두 모드가 갈리는 유일한 자리. 아래 로직은 전부 이 배열만 본다. */
  const places = useMemo(
    () =>
      isSavedView
        ? (routeDetail?.places ?? [])
        : candidates.filter((place) => pickedDates.includes(place.date)),
    [isSavedView, routeDetail, candidates, pickedDates],
  );

  // 시트의 칩 줄에 늘어놓을 날짜. ① 은 캘린더에서 고른 것, ② 는 동선이 걸친 날짜에서 도출한다.
  const dates = useMemo(
    () => (isSavedView ? [...new Set(places.map((place) => place.date))].sort() : pickedDates),
    [isSavedView, places, pickedDates],
  );

  return {
    isSavedView,
    pickedDates,
    routeDetail,
    places,
    dates,
    isLoading,
    isError,
    isOffline,
    refetch,
  };
}
