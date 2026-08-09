import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoutePlaceCandidates } from './hooks/useRoutePlaceCandidates';
import { useCreateRoute } from './hooks/useCreateRoute';
import { RouteRoadmap } from './components/RouteRoadmap';
import { formatRecordDates } from './lib/formatDate';
import {
  DATES_PARAM,
  MAX_PLACES,
  PLACES_PARAM,
  parseDatesParam,
  parsePlacesParam,
  toDatesParam,
  toPlacesParam,
} from './lib/routeParams';
import { NavBar, PrimaryCta } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';

/**
 * 새 동선 만들기 ③단계 — 이름 짓고 저장하기.
 *
 * **지도 시트에서 화면으로 승격한 단계다.** 예전에는 지도 위에 이름 입력 시트를 얹었는데,
 * 저장 직전에 확인해야 할 것(무엇이 어떤 순서로 저장되는가)이 정작 시트에 가린 지도 위
 * 마커에만 있었다. 여기서는 **저장하면 동선 탭에서 보게 될 그 로드맵을 그대로** 먼저 보여준다
 * — 같은 컴포넌트(`RouteRoadmap`)라 '미리보기와 실제가 다른' 일이 생길 수 없다.
 *
 * 화면은 네 칸이다: 로드맵(스크롤) / 이름 / 선택한 내용 / 저장. 가운데 두 칸을 구분선으로
 * 가르는 건 성격이 달라서다 — 위는 **고치는 것**, 아래는 앞 단계에서 이미 정해 **읽는 것**이다.
 *
 * 무엇을 저장할지는 전부 URL 이 들고 있다(`?dates=` + `?places=`). 새로고침·뒤로가기·링크로
 * 들어와도 같은 화면이 서고, 앞 단계로 돌아가면 꺼둔 장소도 그대로 살아난다.
 */
export function RouteSavePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const keyboardOffset = useKeyboardOffset();

  const pickedDates = useMemo(() => parseDatesParam(searchParams.get(DATES_PARAM)), [searchParams]);
  /** 지도에서 켜둔 장소들. **이 화면에서는 필수다** — 저장할 목록 그 자체라 없으면 세울 게 없다. */
  const keptTreeIds = useMemo(
    () => new Set(parsePlacesParam(searchParams.get(PLACES_PARAM))),
    [searchParams],
  );

  const { data, isLoading, isError, isPaused, refetch } = useRoutePlaceCandidates(true);
  const candidates = useMemo(() => data ?? [], [data]);

  /**
   * 네트워크가 끊겨 요청이 멈춘 상태. **로딩도 에러도 아니다** — react-query 는 오프라인이면
   * 재시도를 미뤄두고 `fetchStatus:'paused'` 로 앉아 있으므로, 따로 안 그리면 화면이
   * '장소가 하나도 없는 빈 로드맵'으로 굳는다. 연결이 돌아오면 알아서 이어서 받는다.
   */
  const isOffline = isPaused && data === undefined;

  /**
   * 저장될 장소들. **순서는 URL 이 아니라 후보 목록에서 온다** — 쿼리는 정렬해 실려 오므로
   * 그 순서를 쓰면 방문 순서가 아니라 나무가 심긴 순서가 된다. 후보 목록은 react-query 캐시에
   * 이미 있어 이 화면이 요청을 새로 내지 않는다.
   */
  const places = useMemo(
    () =>
      candidates.filter(
        (place) =>
          pickedDates.includes(place.date) &&
          place.treeId !== undefined &&
          keptTreeIds.has(place.treeId),
      ),
    [candidates, pickedDates, keptTreeIds],
  );

  /**
   * 되돌아갈 곳 — 앞 단계인 지도. 켜둔 장소까지 들려 보내야 다듬어 놓은 상태가 살아난다.
   * 들려 보낼 게 없으면(주소를 손으로 친 경우) 목록을 빼고 보낸다 — 빈 `places=` 는 지도에서
   * '전부 꺼짐'으로 읽혀서, 되돌려 보낸 화면이 텅 빈 채로 선다.
   */
  const mapPath =
    `${ROUTES.journeyView}?${DATES_PARAM}=${toDatesParam(pickedDates)}` +
    (keptTreeIds.size > 0 ? `&${PLACES_PARAM}=${toPlacesParam([...keptTreeIds])}` : '');
  const goBack = useGoBack(mapPath);

  const [name, setName] = useState('');
  const createRoute = useCreateRoute();

  // 장소 수는 지도에서 이미 막지만 여기서 다시 본다 — 주소를 손으로 고쳐 들어올 수 있고,
  // 저장은 되돌릴 수 없다.
  const isOverLimit = places.length > MAX_PLACES;

  /**
   * 이름 없는 동선은 목록에서 서로 구분이 안 된다. 시안에 경고 문구가 없어 문구를 띄우는
   * 대신 버튼을 잠그고 그 자리에 이유를 적는다 — 빈 이름으로 저장할 길 자체가 없다.
   */
  const canSave = name.trim().length > 0 && !isOverLimit && !createRoute.isPending;

  const handleSave = () => {
    if (!canSave) return;

    // 서버는 treeId 만 받는다. 방문 기록에서 온 장소라 항상 있지만, 없으면 그 장소를 빼고
    // 저장하는 게 아니라 통째로 막는다 — 순서가 조용히 어긋난 동선이 저장되면 더 나쁘다.
    const treeIds = places.map((place) => place.treeId);
    if (treeIds.some((treeId) => treeId === undefined)) {
      showToast('저장할 수 없는 장소가 있어요', 'error');
      return;
    }

    createRoute.mutate(
      { routeName: name.trim(), treeIds: treeIds as number[] },
      {
        onSuccess: (newRouteId) => {
          showToast('동선이 저장되었어요!', 'success');
          // 저장한 동선을 바로 보여준다(설계서 8번의 '동선 페이지에 저장').
          // id 를 실어 보내야 동선 탭이 방금 만든 걸 고른다 — 목록 순서는 서버가 정하는 거라
          // '첫 번째가 최신'이라고 기대할 수 없다.
          // replace: 뒤로가기가 방금 끝낸 작성 화면으로 되돌아가지 않게 한다.
          // 토스트는 main.tsx 의 <Toaster /> 가 라우터 밖에 있어 이동해도 살아남는다.
          navigate(ROUTES.journey, { replace: true, state: { selectedRouteId: newRouteId } });
        },
        // 화면을 떠나지 않는다 — 입력한 이름을 살려두고 그대로 다시 누를 수 있게.
        onError: () => showToast('동선을 저장하지 못했어요', 'error'),
      },
    );
  };

  /** 저장될 동선이 걸친 날짜. 하루를 통째로 꺼두면 그 날짜는 여기서도 빠진다. */
  const savedDates = useMemo(
    () => [...new Set(places.map((place) => place.date))].sort(),
    [places],
  );

  const roadmapPlaces = useMemo(
    () => places.map((place) => ({ name: place.name, photoUrl: place.imageUrl })),
    [places],
  );

  // 날짜 없이 들어오는 길은 없다(앞 단계들이 항상 쿼리를 달아 보낸다) — 주소를 손으로 치거나
  // 예전 링크를 눌렀을 때다. 이름 지을 게 없는 화면을 세우는 대신 날짜 고르기로 돌려보낸다.
  if (pickedDates.length === 0) {
    return <Navigate to={ROUTES.journeyCreate} replace />;
  }

  // 고른 날짜에 남은 장소가 하나도 없으면 저장할 게 없다. 지도로 돌려보내 다시 켜게 한다.
  if (!isLoading && !isError && !isOffline && places.length === 0) {
    return <Navigate to={mapPath} replace />;
  }

  return (
    // 키보드가 올라오면 그 높이만큼 화면을 줄인다 — 하단 저장 버튼이 키보드 뒤로 숨지 않고,
    // 줄어드는 몫은 위 로드맵(스크롤 영역)이 흡수한다.
    <div
      style={{ paddingBottom: keyboardOffset }}
      className="flex h-full w-full flex-col bg-[#FFFCEF]"
    >
      <header className="px-5 pt-header">
        {/* 제목이 `동선 저장` 이 아닌 이유는 하단 버튼이다 — 화면 위아래에서 같은 말을 두 번
            하는 대신, 위는 **무엇을 만들고 있는지**, 아래는 **지금 누르면 무슨 일이 나는지**. */}
        <NavBar onBack={goBack} title="새 동선" />
      </header>

      {/* ① 로드맵 미리보기. **이 영역만 스크롤한다** — 장소가 20곳까지 올 수 있어 세로가
          2,300px 을 넘는데(노드 간격 118px), 페이지째 굴리면 이름과 저장 버튼이 화면 밖으로
          밀려나 '무엇을 하는 화면인지'가 사라진다. */}
      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-[#89986d]" />
            <p className="text-[15px] font-medium text-[#5c6f2b]">동선을 그리는 중...</p>
          </div>
        ) : isError || isOffline ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
            <p className="text-center text-[15px] font-medium text-[#2c3930]">
              {isOffline ? '네트워크에 연결되어 있지 않아요' : '동선을 불러오지 못했어요'}
            </p>
            <button
              onClick={() => refetch()}
              className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-[15px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-5 pb-6 pt-4">
            <RouteRoadmap places={roadmapPlaces} />
          </div>
        )}

        {/* 잘린 자리를 크림으로 흐려 '아래가 더 있다'를 알린다. 스크롤바가 없는 모바일에서
            딱 잘린 노드는 그냥 마지막처럼 보인다. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FFFCEF] to-transparent" />
      </div>

      {/* ② 동선 이름. 이 화면에서 사용자가 정하는 유일한 값이라 테두리 없이 놓는다 —
          알약 입력창은 '여기 칸이 있다'를 말하지만, 이 자리에서는 굳이 말할 필요가 없고
          윗줄의 제목처럼 읽히는 편이 낫다.
          16px 인 이유는 iOS 다 — 그보다 작으면 사파리가 포커스할 때 화면을 확대해 버린다. */}
      <div className="border-t border-[#2c3930]/10 px-5 py-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSave()}
          aria-label="동선 이름"
          placeholder="동선 이름 추가..."
          className="w-full bg-transparent text-base text-[#2c3930] outline-none placeholder:text-[#b4b4b4]"
        />
      </div>

      {/* ③ 앞 단계에서 정한 것. **읽기만 한다** — 여기서 장소를 더 고르게 하면 지도가 하는 일과
          겹치고, 고치려면 뒤로 가면 된다. */}
      <div className="border-t border-[#2c3930]/10 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        <dl className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[13px] text-[#60655c]">장소</dt>
            <dd className="text-[15px] text-[#2c3930]">
              {places.length}/{MAX_PLACES}개
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[13px] text-[#60655c]">날짜</dt>
            <dd className="min-w-0 truncate text-[15px] text-[#2c3930]">
              {formatRecordDates(savedDates)}
            </dd>
          </div>
        </dl>

        {isOverLimit && (
          <p className="mt-2 text-[13px] text-[#dc2626]">
            장소는 {MAX_PLACES}개까지 저장할 수 있어요. 뒤로 가서 몇 곳을 꺼주세요
          </p>
        )}

        {/* ④ 저장. 취소 버튼은 없다 — 되돌리기는 헤더의 뒤로가기이고, 이 화면에서 할 수 있는
            일은 하나뿐이라 버튼도 하나다. 잠겼을 때는 왜 잠겼는지를 버튼이 직접 말한다. */}
        <PrimaryCta onClick={handleSave} disabled={!canSave} className="mt-3">
          {/* 잠근 이유를 버튼이 직접 말한다 — 이 화면의 다음 수는 이것뿐이라, 눌리지 않는데
              이유가 없으면 화면이 고장 난 것으로 읽힌다. */}
          {createRoute.isPending
            ? '저장 중...'
            : isOverLimit
              ? `장소를 ${places.length - MAX_PLACES}곳 줄여주세요`
              : name.trim().length === 0
                ? '동선 이름을 입력해주세요'
                : '동선 저장'}
        </PrimaryCta>
      </div>
    </div>
  );
}
