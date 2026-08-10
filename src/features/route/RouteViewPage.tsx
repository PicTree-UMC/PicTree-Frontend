import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { useRouteDetail } from './hooks/useRouteDetail';
import { useRoutePlaceCandidates } from './hooks/useRoutePlaceCandidates';
import {
  RoutePlaceStrip,
  SHEET_COLLAPSED_PX,
  SHEET_EXPANDED_RATIO,
} from './components/RoutePlaceStrip';
import { RouteDateChips } from './components/RouteDateChips';
import { RouteNodeStepper } from './components/RouteNodeStepper';
import {
  DATES_PARAM,
  MAX_PLACES,
  PLACES_PARAM,
  parseDatesParam,
  parsePlacesParam,
  toDatesParam,
  toPlacesParam,
} from './lib/routeParams';
import { buildSequenceMap } from './lib/sequence';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { NavBar } from '@/shared/components';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';

/**
 * 지도 위 동선 화면. **성격이 다른 두 모드를 한 페이지가 겸한다.**
 *
 * | | ① 새 동선 만들기 `/journey/view?dates=` | ② 저장된 동선 보기 `/journey/view/:routeId` |
 * |---|---|---|
 * | 출처 | `GET /trees` 중 쿼리로 받은 날짜 | `GET /routes/{id}` 한 번 |
 * | 다음 단계 | 있음 (③ 이름 짓고 저장) | 없음 |
 *
 * **갈리는 건 `places` 를 만드는 자리 하나뿐이다.** 끄기·번호 재순서화·마커 묶음
 * (설계서 6·7·9번)은 `RoutePlace[]` 만 보므로 두 모드가 그대로 공유한다.
 *
 * ① 의 날짜 고르기는 **앞 단계(`RouteCreatePage`)로 떼어냈다** — 이 화면은 고른 날짜를
 * 쿼리로 받아 지도를 그리는 일만 한다. 날짜를 바꾸려면 뒤로 가면 되므로 상단에 캘린더를
 * 여는 버튼이 없다.
 *
 * ① 의 저장도 **뒷 단계(`RouteSavePage`)로 떼어냈다** — 여기서는 이름 입력 시트를 지도 위에
 * 얹었었다. 시트가 지도를 가리는 바람에, 정작 무엇이 저장되는지 확인할 수 없는 채로 이름을
 * 지어야 했다. 이 화면의 `다음` 은 **다듬은 결과를 URL 에 실어 넘기기만 한다**(아래 `handleNext`).
 *
 * **화면 위에는 뒤로가기(② 는 제목까지)만 띄운다.** 아래는 두 층이다 — 장소 목록과 `다음`
 * 은 접히는 시트에, **날짜 칩은 그 시트 바로 위**에 얹혀 접어도 남는다. 칩이 정하는 건
 * 지도의 보기 범위라, 시트와 함께 숨으면 왜 하루치만 보이는지 화면에 남는 게 없어진다.
 */
/**
 * 겹친 장소를 시트에서 짚어주는 시간. 펼쳐지고 스크롤이 멎기까지가 0.5초 남짓이라
 * 그보다 넉넉해야 하고, 다음 조작을 방해할 만큼 오래 남아 있어도 안 된다.
 */
const HIGHLIGHT_MS = 3000;

/**
 * 시트 위에 얹힌 날짜 칩 줄의 높이(칩 `h-10` 40 + `pb-3` 12).
 *
 * **지도 아래 여백에만 쓰는 어림값이라 재지 않는다** — `SHEET_COLLAPSED_PX` 와 같은 이유로,
 * 몇 px 어긋나도 마커가 가려지지 않는다. 레이아웃은 여전히 내용이 정한다.
 */
const DATE_CHIPS_ROW_PX = 52;

export function RouteViewPage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap();
  const { showToast } = useToast();
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

  /*
    되돌아갈 곳: ① 은 앞 단계(고른 날짜를 들려서), ② 는 동선 탭.
    보통은 `-1` 이라 이 값이 안 쓰이고, 링크로 이 화면에 바로 들어왔을 때만 쓰인다.
    ⚠️ 명시 경로로 **항상** 되돌리면 안 된다 — push 라 지도가 스택에 남아, 앞 단계의
    뒤로가기가 그걸 되짚으면서 두 화면을 오가는 루프가 된다(2026-08-04 실측).
  */
  const goBack = useGoBack(
    isSavedView
      ? ROUTES.journey
      : `${ROUTES.journeyCreate}?${DATES_PARAM}=${toDatesParam(pickedDates)}`,
  );

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

  /*
    하단바에서 꺼둔 장소(설계서 7번). 목록에는 남기고 번호·개수·동선에서만 뺀다.

    **손대기 전까지는 URL(`?places=`)이 진실이고, 한 번 만지면 그때부터 로컬 상태가 진실이다.**
    ③단계에서 뒤로 오면 이 화면이 다시 마운트되므로 상태만으로는 다듬어 놓은 게 전부 되살아난다
    — 앞 단계의 `?dates=` 와 같은 이유, 같은 방식이다. effect 로 URL 을 상태에 옮겨 담지 않는
    이유는 후보 목록이 도착하기 전 한 프레임 동안 **전부 켜진 동선**이 지도에 그려지기 때문이다.

    URL 은 **켜진 것**을 `treeId` 로 말하고 여기는 **꺼진 것**을 화면용 id 로 센다. 양쪽이
    뒤집혀 있는 데는 각자 이유가 있다:
    - URL 이 켜진 쪽인 건 길이 때문이다(`parsePlacesParam` 주석).
    - 여기가 꺼진 쪽인 건 ② 때문이다 — 저장된 동선을 볼 땐 URL 에 목록이 없고, 아무것도 안
      건드린 상태가 곧 '전부 켜짐'이라 빈 배열이 기본값이 된다.
    - URL 이 `treeId` 인 건 화면용 id 가 후보 목록의 자리 번호라서고, 여기가 화면용 id 인 건
      ② 에서 같은 나무를 두 번 방문한 동선이 있을 수 있어서다(`RoutePlace.id` 주석).
  */
  const keptTreeIds = useMemo(() => {
    const raw = searchParams.get(PLACES_PARAM);
    // 파라미터 자체가 없으면 '전부 켜짐' — 지도로 처음 들어온 길이다. 빈 문자열과 구분해야 해서
    // `parsePlacesParam` 의 결과가 아니라 `raw` 로 판정한다.
    return raw === null ? null : new Set(parsePlacesParam(raw));
  }, [searchParams]);

  const [touchedDisabledIds, setTouchedDisabledIds] = useState<number[] | null>(null);
  /* ⚠️ 반드시 메모해야 한다 — 매 렌더 새 배열이면 아래 `disabledIds`(Set)도 매번 새것이 되고,
     그걸 의존성으로 받는 `useRoutePath` 의 effect 가 렌더마다 지도를 다시 그린다. */
  const disabledPlaceIds = useMemo(
    () =>
      touchedDisabledIds ??
      (keptTreeIds === null
        ? []
        : places
            // treeId 가 없는 장소는 켜 둔다 — 어차피 저장 단계에서 걸리고, 조용히 빠지는 것보다
            // 목록에 남아 있는 편이 왜 안 되는지 찾기 쉽다.
            .filter((place) => place.treeId !== undefined && !keptTreeIds.has(place.treeId))
            .map((place) => place.id)),
    [touchedDisabledIds, places, keptTreeIds],
  );

  const disabledIds = useMemo(() => new Set(disabledPlaceIds), [disabledPlaceIds]);
  const activePlaces = useMemo(
    () => places.filter((place) => !disabledIds.has(place.id)),
    [places, disabledIds],
  );

  /*
    지금 들여다보는 날짜. `null` 이면 전부. **시트 목록과 지도가 같이 좁혀진다.**

    **보기만 거른다** — 걸러진 날짜의 장소도 동선에는 그대로 남고 번호도 유지된다(저장되는
    범위는 `activePlaces` 이고 이 필터와 무관하다). 예전엔 날짜 칩이 그날 장소를 통째로 껐다
    켰는데, 한 손짓에 '보기'와 '넣기/빼기'가 겹쳐 있어서 그날만 들여다보려고 눌렀다가
    동선에서 빠지는 일이 났다. 넣고 빼기는 `전체 선택`/`전체 해제` 와 줄 탭이 맡는다.

    고른 날짜가 목록에서 사라질 수 있어(② 에서 동선을 다시 받아오면 날짜 집합이 바뀐다)
    상태를 그대로 믿지 않고 매번 걸러 쓴다 — effect 로 되돌리면 한 프레임 동안 빈 목록이 뜬다.
  */
  const [pickedDateFilter, setPickedDateFilter] = useState<string | null>(null);
  const dateFilter =
    pickedDateFilter !== null && dates.includes(pickedDateFilter) ? pickedDateFilter : null;

  /** 지금 목록에 보이는 장소들. `전체 선택`/`전체 해제` 가 대상으로 삼는 범위이기도 하다. */
  const visiblePlaces = useMemo(
    () => (dateFilter === null ? places : places.filter((place) => place.date === dateFilter)),
    [places, dateFilter],
  );

  const allVisibleSelected =
    visiblePlaces.length > 0 && visiblePlaces.every((place) => !disabledIds.has(place.id));

  /*
    동선 따라가기.

    축소하면 번호가 뭉쳐 순서를 못 읽고, 읽히는 배율까지 확대하면 다음 장소가 화면 밖으로
    나간다 — 그래서 지도를 손으로 밀어 다음 곳을 찾아야 했다. 순서대로 옮겨 주는 버튼 하나로
    그 왕복을 없앤다.

    훑는 범위는 **지금 보고 있는 것과 같다** — 날짜를 걸렀으면 그 하루만, 꺼둔 장소는 건너뛴다.
    번호는 전체 기준을 그대로 쓰므로(`sequenceById`) 4월 1일만 볼 때도 `3. 도담도담` 이다.
  */
  const sequenceById = useMemo(() => buildSequenceMap(places, disabledIds), [places, disabledIds]);
  const steppablePlaces = useMemo(
    () => visiblePlaces.filter((place) => !disabledIds.has(place.id)),
    [visiblePlaces, disabledIds],
  );

  const [focusedPlaceId, setFocusedPlaceId] = useState<number | null>(null);
  /*
    날짜를 바꾸면 따라가던 자리를 놓는다. 그 하루가 통째로 화면에 담기는 게 먼저고, 이전
    날짜의 장소를 계속 가리키고 있으면 지도가 그리로 되돌아가 버린다.
    끄기·켜기는 그대로 둔다 — 보던 자리는 그대로이고 번호만 당겨진다.
  */
  useEffect(() => setFocusedPlaceId(null), [dateFilter]);

  /*
    지도에서 겹쳐서 못 쪼개지는 묶음을 탭했을 때 시트가 짚어줄 장소들.

    지도가 "여기선 더 확대해도 안 갈라진다"고 답하는 자리라, 그냥 두면 눌러도 아무 일이
    없어 고장처럼 보인다. 겹친 장소들은 시트 목록에 번호대로 이미 다 있으니 거기로 데려간다.

    잠깐 보였다 사라진다 — 계속 남으면 사용자가 지우는 방법을 찾아야 하는 상태가 하나 는다.
    같은 묶음을 다시 탭하면 배열이 새로 와서(내용이 같아도) 다시 짚어준다.
  */
  const [highlightedPlaceIds, setHighlightedPlaceIds] = useState<number[]>([]);

  useEffect(() => {
    if (highlightedPlaceIds.length === 0) return;

    const timer = setTimeout(() => setHighlightedPlaceIds([]), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedPlaceIds]);

  /**
   * 겹쳐서 못 쪼개지는 묶음 탭.
   *
   * **다른 날짜가 섞여 있을 때만 필터를 푼다** — 필터가 걸린 채로 짚으면 목록에 없는 줄을
   * 가리키게 되기 때문이다. 지도도 같이 걸러지면서 묶음이 필터 밖 장소를 물고 있는 일은
   * 사실상 없어졌지만, 그렇다고 늘 풀어버리면 방금 좁혀 본 하루가 통째로 되돌아간다.
   */
  const handleOverlappingTap = (placeIds: number[]) => {
    const tapped = new Set(placeIds);
    const spansOtherDates =
      dateFilter !== null &&
      places.some((place) => tapped.has(place.id) && place.date !== dateFilter);

    if (spansOtherDates) setPickedDateFilter(null);
    setHighlightedPlaceIds(placeIds);
  };

  /*
    지도가 화면을 맞출 때 아래에 비워둘 높이.

    시트는 지도 **위에 떠 있어서** 지도 영역을 깎지 않는다 — 알려주지 않으면 카카오는
    시트 뒤쪽까지 지도로 치고 그 안에 마커를 배치한다. 그러면 좁혀 본 하루의 마커가
    시트에 가려 안 보인다.

    ⚠️ **펼친 시트 높이가 45dvh 로 고정이라 잴 필요 없이 계산으로 안다.** 예전처럼 카드
    수에 따라 높이가 변했다면 여기서 실제 높이를 측정해 넘겨야 했다.

    `innerHeight` 는 렌더 시점 값이라 회전 직후 한 박자 어긋날 수 있는데, 다음에 날짜를
    바꾸거나 장소가 갱신될 때 제 값으로 다시 맞춰진다.
  */
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  /*
    지도가 아래에 비워둘 높이 = 시트 + **그 위에 얹힌 날짜 칩 줄**. 칩 줄도 지도 위에 떠 있어서
    안 더하면 맨 아래 마커가 칩 뒤로 들어간다. 시트 높이와 같은 이유로 어림값이면 충분하다
    (칩 h-10 40 + `pb-3` 12 = 52). 날짜가 없으면 줄 자체가 안 그려지므로 0 이다.
  */
  const sheetHeightPx =
    (sheetCollapsed ? SHEET_COLLAPSED_PX : Math.round(window.innerHeight * SHEET_EXPANDED_RATIO)) +
    (dates.length > 0 ? DATE_CHIPS_ROW_PX : 0);

  useRoutePath(map, places, disabledIds, {
    dateFilter,
    bottomPaddingPx: sheetHeightPx,
    focusedPlaceId,
    onOverlappingTap: handleOverlappingTap,
  });

  /**
   * 장소 칩 탭(설계서 7번). 그 장소를 껐다 켜고, 켜진 것만 세어 번호를 다시 매긴다.
   * 마지막 남은 장소를 끄면 `disabledDates` 가 따라 켜져 그 날짜 칩도 같이 흐려진다.
   */
  const togglePlace = (placeId: number) =>
    setTouchedDisabledIds(
      disabledPlaceIds.includes(placeId)
        ? disabledPlaceIds.filter((id) => id !== placeId)
        : [...disabledPlaceIds, placeId],
    );

  /**
   * `전체 선택`/`전체 해제`(설계서 6번). **지금 보이는 범위**에만 적용된다 — 날짜를 걸러
   * 놓았으면 그 날짜만, 전체를 보고 있으면 동선 전체.
   *
   * 하나라도 꺼져 있으면 전부 켜고, 전부 켜져 있을 때만 끈다. '거의 다 켜진' 상태에서
   * 눌렀을 때 남은 몇 개를 마저 켜주는 쪽이, 애써 켠 걸 통째로 지우는 것보다 되돌리기 쉽다.
   */
  const toggleAllVisible = () => {
    const idsOfVisible = visiblePlaces.map((place) => place.id);
    if (idsOfVisible.length === 0) return;

    setTouchedDisabledIds(
      allVisibleSelected
        ? [...new Set([...disabledPlaceIds, ...idsOfVisible])]
        : disabledPlaceIds.filter((id) => !idsOfVisible.includes(id)),
    );
  };

  /**
   * ③ 이름 짓고 저장하기로. **다듬은 결과를 URL 에 실어 넘긴다** — 저장 자체는 저기서 한다.
   *
   * 여기서 막는 건 다음 화면이 세워질 수 없는 경우뿐이다. **장소 0곳만 눌린 뒤에 토스트로
   * 알려준다** — 한도 초과는 시트가 버튼째 잠근다. 0곳은 장소를 빼다 지나가는 한때라
   * 시작하자마자 잠긴 버튼을 보여줄 이유가 없고, 한도 초과는 되돌리기 전엔 계속 잘못이다.
   *
   * ⚠️ **지도 자신의 URL 도 `replace` 로 고쳐 둔다.** 다음 화면에서 뒤로 오면 히스토리의
   * **이 항목**으로 돌아오는데, 여기에 `?places=` 가 없으면 꺼둔 장소가 전부 되살아난다.
   */
  const handleNext = () => {
    if (activePlaces.length === 0) {
      showToast('장소를 하나 이상 켜야 동선을 저장할 수 있어요', 'error', { placement: 'top' });
      return;
    }
    // 한도 초과는 시트가 이미 막아 둔다(개수 줄이 ERROR 로 바뀌고 `다음` 이 잠긴다).
    // 여기 남겨 둔 건 마지막 빗장이다 — 잠금은 시트가 스스로 계산하는 값이라, 페이지가
    // 그걸 믿고 다음 화면까지 내보내면 한쪽만 어긋나도 조용히 넘어간다.
    if (activePlaces.length > MAX_PLACES) return;

    // 켜둔 장소를 `treeId` 로 옮겨 적는다. 화면용 id 는 후보 목록에서의 자리 번호라 나무가
    // 하나 늘면 가리키는 곳이 밀린다(`parsePlacesParam` 주석).
    // 위에서 20곳 초과를 막았으므로 여기서 나가는 id 는 아무리 많아도 스무 개다.
    const keptIds = activePlaces
      .map((place) => place.treeId)
      .filter((treeId): treeId is number => treeId !== undefined);

    const search = `?${DATES_PARAM}=${toDatesParam(pickedDates)}&${PLACES_PARAM}=${toPlacesParam(keptIds)}`;
    navigate({ search }, { replace: true });
    navigate(`${ROUTES.journeySave}${search}`);
  };

  // 날짜 없이 ① 로 들어오는 길은 없다(앞 단계가 항상 쿼리를 달아 보낸다) — 주소를 손으로
  // 치거나 예전 링크를 눌렀을 때다. 빈 지도를 보여주는 대신 날짜 고르기로 돌려보낸다.
  if (!isSavedView && pickedDates.length === 0) {
    return <Navigate to={ROUTES.journeyCreate} replace />;
  }

  return (
    <div className="relative h-full w-full bg-white">
      {/* 지도 — 뷰포트를 꽉 채우는 fixed 배경. flex-1 로 두면 컬럼 안에만 그려진다
          (mx-auto sm:max-w-[390px]: 데스크톱 컬럼 폭).
          isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를 가둬서
          헤더·하단 strip 등 위로 뜬 UI 를 덮지 않게 한다. */}
      <div ref={containerRef} className="isolate fixed inset-0 z-0 mx-auto sm:max-w-[390px]" />

      {/* 헤더는 지도 위에 떠 있다. 지도 영역을 깎지 않도록 absolute. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-header">
        {/* 스크림이 없다 — 예전엔 상단 전체에 크림 그라데이션을 깔아 제목·뒤로가기가 지도
            라벨에 묻히는 걸 막았다(#103). 지금은 **요소마다 자기 방어책을 갖는다**: 뒤로가기는
            흰 원, 제목은 흰 외곽선(`.text-halo`). 지도를 덮는 면적이 그라데이션보다 훨씬 작아
            상단 지형이 그대로 보이고, 대비는 오히려 더 확실하다.

            제목이 알약이었다가 외곽선으로 바뀌었다 — 알약은 글자 길이만큼 지도를 사각으로
            덮는데, 외곽선은 획 주변 몇 px 만 덮는다. 카카오맵이 지명에 쓰는 방식이다.

            ① 도 제목을 갖는다. 한동안 뺐었지만(앞 단계를 거쳐 온 사람에게 '동선 보기' 가
            알려주는 게 없다는 이유), 지금은 제목이 알약처럼 한 줄을 차지하지도 않고
            다른 화면과 헤더 얼개가 같아야 해서 되살렸다.

            위 여백은 바깥 pt-header 가 준다 — 여기서 또 주면 스텝 1 보다 내려앉는다. */}
        <NavBar
          className="pointer-events-auto px-5"
          onBack={goBack}
          /* ② 는 어느 동선을 보고 있는지가 제목이다. 아직 안 불러왔으면 비워 둬서
             제목이 깜빡이지 않게 한다. */
          title={isSavedView ? routeDetail?.title : '장소 선택'}
          titleOnMap
        />
      </div>

      {/* 불러오는 동안·실패했을 때 지도 위에 얹는다. 하단 strip 을 가리지 않아서
          '표시할 동선이 없어요' 와 상태가 엇갈려 보이지 않는다. */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/70">
          <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
          <p className="text-[15px] font-medium text-pictree-700">동선을 불러오는 중...</p>
        </div>
      )}

      {(isError || isOffline) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 px-8">
          <p className="text-center text-[15px] font-medium text-ink">
            {isOffline ? '네트워크에 연결되어 있지 않아요' : '동선을 불러오지 못했어요'}
          </p>
          <button
            onClick={() => refetch()}
            className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-[15px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 하단 동선 strip — 지도가 fixed 배경이 되면서 흐름에서 빠졌으므로,
          바텀 패널로 지도 위에 띄운다(내부에서 pb-safe 로 홈 인디케이터를 피한다).

          키보드를 피할 일이 없다 — 이 화면에는 입력이 없다(이름은 ③ `/journey/save` 가 받는다). */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        {/*
          날짜 필터 칩 — **시트 안이 아니라 시트 바로 위**다.

          칩은 고르는 게 아니라 거르는 것이고, 거르면 목록만이 아니라 **지도가 같이 좁혀진다**.
          시트 안에 있을 때는 시트를 접으면 칩이 같이 숨는데 지도는 계속 걸러진 채여서,
          왜 하루치만 보이는지 알려주는 게 화면에 하나도 안 남았다. 밖으로 나오면서 접든 말든
          지금 걸린 범위가 화면에 떠 있고, 시트는 **동선에 무엇을 넣을지** 하나만 다루게 됐다
          (칩 줄이 비운 자리는 장소 목록이 가져갔다 — 2.2 → 2.8줄).

          위가 아니라 여기 붙이는 이유는 **거르는 대상이 바로 아래 목록**이라서다. `전체 선택`
          도 걸린 범위에만 적용되므로 둘이 멀어지면 무엇에 걸리는지 읽기 어렵다.
          ⚠️ 대신 시트에 매인 자리라 접으면 칩도 같이 내려온다. 예전 따라가기 알약이 이 자리에
          있다가 시트 안으로 들어간 적이 있다 — 그때는 알약이 지도를 가리기만 했지만, 칩은
          지도에 무엇이 그려질지를 정하는 줄이라 지도 곁에 있는 값이 더 크다.

          흰 채움 `outline` 칩이라 지도 위에서 그대로 읽힌다 — 누를 자리는 면이 있어야 보인다.
        */}
        {dates.length > 0 && (
          <div className="px-5 pb-3">
            <RouteDateChips
              dates={dates}
              filter={dateFilter}
              onChangeFilter={setPickedDateFilter}
            />
          </div>
        )}

        <RoutePlaceStrip
          places={places}
          disabledPlaceIds={disabledIds}
          // 값만 넘긴다 — 거르는 칩 줄은 지도 위에 있다(위 헤더 블록 참고).
          dateFilter={dateFilter}
          allVisibleSelected={allVisibleSelected}
          onToggleAllVisible={toggleAllVisible}
          // ② 는 저장 한도가 의미 없다 — `3/20개` 는 더 담을 수 있다는 오해를 준다.
          maxPlaces={isSavedView ? undefined : MAX_PLACES}
          // `다음` 이 헤더에서 여기로 내려왔다. 넘어가는 건 이 목록이고 한도(n/20)도 이 줄이
          // 들고 있어서, 지도 반대편 끝에 떨어져 있는 것보다 맥락이 이어진다.
          onNext={isSavedView ? undefined : handleNext}
          onTogglePlace={togglePlace}
          highlightedPlaceIds={highlightedPlaceIds}
          focusedPlaceId={focusedPlaceId}
          // 접힘을 페이지가 들고 있는 이유는 지도다 — 시트가 덮는 높이만큼 화면을 비워야 한다.
          collapsed={sheetCollapsed}
          onCollapsedChange={setSheetCollapsed}
          // 따라가기는 시트의 붙박이 머리 줄이다. 한동안 시트 위에 뜨는 알약이었는데,
          // 어차피 시트 높이에 맞춰 띄워둔 것이라 시트에 매인 채 지도만 가리고 있었다.
          // 시트 안으로 들어오면서 '조작은 전부 시트' 원칙에 예외가 없어졌고, 알약이 비운
          // 자리는 지도가 가져간다. 접혀도 남는 자리라 접어 놓고 지도만 보며 따라갈 수 있다.
          // 훑을 게 없으면 안 넘긴다 — 그때는 시트가 `전체 동선` 제목을 대신 세운다.
          stepper={
            steppablePlaces.length > 0 ? (
              <RouteNodeStepper
                places={steppablePlaces}
                sequenceById={sequenceById}
                focusedPlaceId={focusedPlaceId}
                onFocus={setFocusedPlaceId}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
