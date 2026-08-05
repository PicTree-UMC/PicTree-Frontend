import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { useRouteDetail } from './hooks/useRouteDetail';
import { useRoutePlaceCandidates } from './hooks/useRoutePlaceCandidates';
import { useCreateRoute } from './hooks/useCreateRoute';
import { RouteDateBar } from './components/RouteDateBar';
import { RouteDateSheet } from './components/RouteDateSheet';
import { RoutePlaceStrip } from './components/RoutePlaceStrip';
import { SaveRouteSheet } from './components/SaveRouteSheet';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';

/** 화면설계서 0번: 한 번에 고를 수 있는 날짜는 3일, 저장할 수 있는 장소는 20개까지. */
const MAX_DATES = 3;
const MAX_PLACES = 20;

/**
 * 지도 위 동선 화면. **성격이 다른 두 모드를 한 페이지가 겸한다.**
 *
 * | | ① 새 동선 만들기 `/journey/view` | ② 저장된 동선 보기 `/journey/view/:routeId` |
 * |---|---|---|
 * | 출처 | `GET /trees` 중 고른 날짜 | `GET /routes/{id}` 한 번 |
 * | 날짜 관리·캘린더 | 있음 | 없음 (동선이 날짜를 이미 들고 있다) |
 * | 동선저장 | 있음 (`POST /routes`) | 없음 |
 *
 * **갈리는 건 `places` 를 만드는 자리 하나뿐이다.** 끄기·번호 재순서화·마커 묶음
 * (설계서 6·7·9번)은 `RoutePlace[]` 만 보므로 두 모드가 그대로 공유한다.
 */
export function RouteViewPage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap();
  const { showToast } = useToast();

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

  const createRoute = useCreateRoute();

  /**
   * 네트워크가 끊겨 요청이 멈춘 상태. **로딩도 에러도 아니다** — react-query 는 오프라인이면
   * 재시도를 미뤄두고 `fetchStatus:'paused'` 로 앉아 있으므로, 따로 안 그리면 화면이
   * '제목 없는 빈 지도'로 굳는다(2026-07-31 실측). 연결이 돌아오면 알아서 이어서 받는다.
   */
  const isOffline = source.isPaused && source.data === undefined;

  // 시안의 기본 상태는 '아무 날짜도 안 고른 상태'다. 전체 동선을 미리 그려주지 않는다
  // — 날짜를 골라야 지도에 동선이 뜬다(화면설계서 2번). ② 에서는 쓰이지 않는다.
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  // 하단바에서 꺼둔 장소(설계서 7번). 목록에는 남기고 번호·개수·동선에서만 뺀다.
  const [disabledPlaceIds, setDisabledPlaceIds] = useState<number[]>([]);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  /** ① 에서 고를 수 있는 장소 전부(방문 기록이 있는 것만). ② 에서는 비어 있다. */
  const candidates = useMemo(() => candidatesQuery.data ?? [], [candidatesQuery.data]);

  // 캘린더가 '방문한 날짜 + 그날 장소 수'를 요구한다(설계서 1번). ① 에서만 쓴다.
  const placeCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((place) => counts.set(place.date, (counts.get(place.date) ?? 0) + 1));
    return counts;
  }, [candidates]);

  /** 두 모드가 갈리는 유일한 자리. 아래 로직은 전부 이 배열만 본다. */
  const places = useMemo(
    () =>
      isSavedView
        ? (routeDetail?.places ?? [])
        : candidates.filter((place) => pickedDates.includes(place.date)),
    [isSavedView, routeDetail, candidates, pickedDates],
  );

  // 상단 칩에 늘어놓을 날짜. ① 은 캘린더에서 고른 것, ② 는 동선이 걸친 날짜에서 도출한다.
  const dates = useMemo(
    () => (isSavedView ? [...new Set(places.map((place) => place.date))].sort() : pickedDates),
    [isSavedView, places, pickedDates],
  );

  const disabledIds = useMemo(() => new Set(disabledPlaceIds), [disabledPlaceIds]);
  const activePlaces = useMemo(
    () => places.filter((place) => !disabledIds.has(place.id)),
    [places, disabledIds],
  );

  /**
   * 장소가 하나도 안 켜진 날짜 = 비활성 날짜(설계서 7번). 별도 상태로 들고 있지 않고 여기서
   * 도출한다 — 날짜와 장소를 각각 저장하면 "날짜는 켜졌는데 장소는 다 꺼진" 모순이 생긴다.
   */
  const disabledDates = useMemo(
    () =>
      new Set(
        dates.filter((date) => {
          const ofDate = places.filter((place) => place.date === date);
          return ofDate.length > 0 && ofDate.every((place) => disabledIds.has(place.id));
        }),
      ),
    [dates, places, disabledIds],
  );

  useRoutePath(map, places, disabledIds);

  const toggleDate = (dateKey: string) => {
    setPickedDates((current) =>
      current.includes(dateKey)
        ? current.filter((date) => date !== dateKey)
        : // 지도·하단바의 순번이 날짜 순서를 따라가도록 항상 오름차순으로 유지한다.
          [...current, dateKey].sort(),
    );
    // 날짜가 빠지면 그 날짜에서 껐던 기억도 지운다 — 다시 고르면 전부 켜진 상태로 돌아온다.
    // (안 지우면 며칠 전에 끈 장소가 되살아난 날짜에서 소리 없이 빠져 있다.)
    setDisabledPlaceIds((ids) =>
      ids.filter((id) => candidates.find((place) => place.id === id)?.date !== dateKey),
    );
  };

  /**
   * 하단바 장소 칩 탭(설계서 7번). 그 장소를 껐다 켜고, 켜진 것만 세어 번호를 다시 매긴다.
   * 마지막 남은 장소를 끄면 `disabledDates` 가 따라 켜져 상단 날짜도 같이 흐려진다.
   */
  const togglePlace = (placeId: number) =>
    setDisabledPlaceIds((ids) =>
      ids.includes(placeId) ? ids.filter((id) => id !== placeId) : [...ids, placeId],
    );

  /**
   * 상단 날짜 칩 탭(설계서 6번). 날짜를 목록에서 빼지 않고 **그날 장소를 통째로 껐다 켠다** —
   * 칩이 사라지면 되돌릴 길이 캘린더뿐이라, 흐려진 채로 남겨 다시 누를 수 있게 한다.
   */
  const toggleDateActive = (dateKey: string) => {
    const idsOfDate = places.filter((place) => place.date === dateKey).map((place) => place.id);
    if (idsOfDate.length === 0) return;

    setDisabledPlaceIds((ids) =>
      disabledDates.has(dateKey)
        ? ids.filter((id) => !idsOfDate.includes(id))
        : [...new Set([...ids, ...idsOfDate])],
    );
  };

  const selectFirstDates = () => {
    setPickedDates([...placeCountByDate.keys()].sort().slice(0, MAX_DATES));
    setDisabledPlaceIds([]); // 선택을 통째로 갈아끼우는 동작이라 껐던 기억도 같이 비운다
  };

  const handleSave = () => {
    if (activePlaces.length === 0) {
      showToast('날짜를 선택하면 동선을 저장할 수 있어요', 'error', { placement: 'top' });
      return;
    }
    if (activePlaces.length > MAX_PLACES) {
      showToast(`장소는 ${MAX_PLACES}개까지 저장할 수 있어요`, 'error', { placement: 'top' });
      return;
    }
    setShowSaveSheet(true);
  };

  const handleConfirmSave = (name: string) => {
    // 서버는 treeId 만 받는다. 방문 기록에서 온 장소라 항상 있지만, 없으면 그 장소를 빼고
    // 저장하는 게 아니라 통째로 막는다 — 순서가 조용히 어긋난 동선이 저장되면 더 나쁘다.
    const treeIds = activePlaces.map((place) => place.treeId);
    if (treeIds.some((treeId) => treeId === undefined)) {
      showToast('저장할 수 없는 장소가 있어요', 'error', { placement: 'top' });
      return;
    }

    createRoute.mutate(
      { routeName: name, treeIds: treeIds as number[] },
      {
        onSuccess: (newRouteId) => {
          setShowSaveSheet(false);
          showToast('동선이 저장되었어요!', 'success', { placement: 'top' });
          // 저장한 동선을 바로 보여준다(설계서 8번의 '동선 페이지에 저장').
          // id 를 실어 보내야 동선 탭이 방금 만든 걸 고른다 — 목록 순서는 서버가 정하는 거라
          // '첫 번째가 최신'이라고 기대할 수 없다.
          // replace: 뒤로가기가 방금 끝낸 작성 화면으로 되돌아가지 않게 한다.
          // 토스트는 main.tsx 의 <Toaster /> 가 라우터 밖에 있어 이동해도 살아남는다.
          navigate(ROUTES.journey, { replace: true, state: { selectedRouteId: newRouteId } });
        },
        // 시트를 닫지 않는다 — 입력한 이름을 살려두고 그대로 다시 누를 수 있게.
        onError: () => showToast('동선을 저장하지 못했어요', 'error', { placement: 'top' }),
      },
    );
  };

  return (
    <div className="relative h-full w-full bg-white">
      {/* 지도 — 노치(safe-area)까지 덮는 fixed 풀블리드 배경.
          기준 상자는 body 프레임 = 실제 화면이다(styles.css). flex-1 로 두면 지도가 컬럼
          안에만 그려져 노치 영역이 크림 base 로 비어 '잘려 보인다'. `inset-0` 하나로 화면을
          덮고, 오프셋은 더하지 않는다(mx-auto sm:max-w-[390px]: 데스크톱 컬럼 폭).
          isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를 가둬서
          헤더·하단 strip 등 위로 뜬 UI 를 덮지 않게 한다. */}
      <div ref={containerRef} className="isolate fixed inset-0 z-0 mx-auto sm:max-w-[390px]" />

      {/* 헤더와 날짜 관리 바는 지도 위에 떠 있다. 지도 영역을 깎지 않도록 absolute. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-safe">
        {/* 스크림 — 제목·뒤로가기가 지도에 묻히던 문제(#103). 이 둘만 배경 없는 맨 글자라
            카카오맵의 지하철 아이콘·POI 라벨과 겹치면 아예 안 읽힌다(옆의 `동선저장`·
            `날짜 관리` 는 어두운 알약이라 멀쩡했다).

            알약을 하나 더 붙이는 대신 그라데이션을 깐 이유: 상단에 배경 있는 요소가 넷이 되면
            지도 위가 칩 밭이 된다. CameraPage·MarkerStoryViewer 가 쓰는 것과 같은 수법이고,
            색만 검정 대신 앱 base 크림이다 — 글자가 어두운 초록이라 검정 스크림은 오히려
            대비가 줄고, 크림/짙은초록은 앱이 원래 쓰는 짝이다.

            아래로 24px 더 내려 컨텐츠 끝에서 딱 끊기지 않게 한다. 날짜 칩이 생기면 부모가
            높아지면서 스크림도 같이 늘어난다. to-[#fffcef]/0 은 `to-transparent`(=투명한 검정)
            로 중간이 탁해지는 걸 피하려는 것. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -bottom-6 -z-10 bg-gradient-to-b from-[#fffcef] via-[#fffcef]/85 to-[#fffcef]/0"
        />

        <header className="pointer-events-auto flex items-center gap-2 px-5 pt-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="-ml-1 p-1 text-[#2c3930]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {/* ② 는 어느 동선을 보고 있는지가 '동선 보기' 보다 훨씬 쓸모 있다. 이름이 길 수 있어
              한 줄로 자른다. 아직 안 불러왔으면 자리를 비워 제목이 깜빡이지 않게 한다. */}
          <h1 className="flex-1 truncate text-xl font-medium text-[#2c3930]">
            {isSavedView ? (routeDetail?.name ?? '') : '동선 보기'}
          </h1>
          {/* 저장에 성공하면 동선 탭으로 넘어가므로 '저장됨' 같은 완료 상태가 필요 없다 —
              이 화면에 남아 있다는 건 아직 저장 전이라는 뜻이다. */}
          {!isSavedView && (
            <button
              onClick={handleSave}
              className="shrink-0 rounded-[8px] bg-[#2c3930] px-3 py-1.5 text-[13px] font-medium tracking-wide text-[#fffcef] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
            >
              동선저장
            </button>
          )}
        </header>

        <div className="pointer-events-auto">
          <RouteDateBar
            selectedDates={dates}
            disabledDates={disabledDates}
            maxDates={MAX_DATES}
            // ② 는 캘린더가 없다 → 넘기지 않으면 `날짜 관리` 버튼째 사라진다.
            onOpenDatePicker={isSavedView ? undefined : () => setShowDateSheet(true)}
            onToggleDate={toggleDateActive}
          />
        </div>
      </div>

      {/* 불러오는 동안·실패했을 때 지도 위에 얹는다. 하단 strip 을 가리지 않아서
          '표시할 동선이 없어요' 와 상태가 엇갈려 보이지 않는다. */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/70">
          <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#89986d]" />
          <p className="text-[15px] font-medium text-[#5c6f2b]">동선을 불러오는 중...</p>
        </div>
      )}

      {(isError || isOffline) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 px-8">
          <p className="text-center text-[15px] font-medium text-[#2c3930]">
            {isOffline ? '네트워크에 연결되어 있지 않아요' : '동선을 불러오지 못했어요'}
          </p>
          <button
            onClick={() => refetch()}
            className="h-[46px] rounded-[24px] bg-[#89986d] px-8 text-[15px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 하단 동선 strip — 지도가 fixed 배경이 되면서 흐름에서 빠졌으므로,
          바텀 패널로 지도 위에 띄운다(내부에서 pb-safe 로 홈 인디케이터를 피한다). */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <RoutePlaceStrip
          places={places}
          disabledPlaceIds={disabledIds}
          // ② 는 저장 한도가 의미 없다 — `3/20개` 는 더 담을 수 있다는 오해를 준다.
          maxPlaces={isSavedView ? undefined : MAX_PLACES}
          onTogglePlace={togglePlace}
        />
      </div>

      {showDateSheet && (
        <RouteDateSheet
          placeCountByDate={placeCountByDate}
          selectedDates={pickedDates}
          selectedPlaceCount={activePlaces.length}
          maxDates={MAX_DATES}
          maxPlaces={MAX_PLACES}
          onToggleDate={toggleDate}
          onSelectFirstDates={selectFirstDates}
          onClearDates={() => {
            setPickedDates([]);
            setDisabledPlaceIds([]);
          }}
          onClose={() => setShowDateSheet(false)}
        />
      )}

      {showSaveSheet && (
        <SaveRouteSheet
          isSaving={createRoute.isPending}
          onClose={() => setShowSaveSheet(false)}
          onConfirm={handleConfirmSave}
        />
      )}
    </div>
  );
}
