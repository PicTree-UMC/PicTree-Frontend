import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { useRouteViewPlaces } from './hooks/useRouteViewPlaces';
import { useRoutePlaceSelection } from './hooks/useRoutePlaceSelection';
import { useRoutePlaceFocus } from './hooks/useRoutePlaceFocus';
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
  toDatesParam,
  toPlacesParam,
} from './lib/routeParams';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { NavBar, Spinner } from '@/shared/components';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';

/**
 * 지도 위 동선 화면. **성격이 다른 두 모드를 한 페이지가 겸한다.**
 *
 * | | ① 새 동선 만들기 `/journey/view?dates=` | ② 저장된 동선 보기 `/journey/view/:routeId` |
 * |---|---|---|
 * | 출처 | `GET /trees` 중 쿼리로 받은 날짜 | `GET /routes/{id}` 한 번 |
 * | 다음 단계 | 있음 (③ 이름 짓고 저장) | 없음 |
 * | 하단 시트 | 다듬는다 (줄 탭·`전체 선택`) | **읽기 전용** |
 *
 * **갈리는 건 `places` 를 만드는 자리와, 시트에 넘기는 조작뿐이다.** 끄기·번호 재순서화·
 * 마커 묶음(설계서 6·7·9번)은 `RoutePlace[]` 만 보므로 두 모드가 그대로 공유한다.
 *
 * ⚠️ ② 가 읽기 전용인 이유는 **저장할 데가 없기 때문**이다. 한동안 시트를 통째로 공유해서
 * 보러 들어온 화면에서도 장소를 뺄 수 있었는데, `다음` 이 없으니 그 결과가 어디에도 남지
 * 않고 새로고침 한 번에 되돌아왔다. ② 에 남는 조작은 **무엇을 보여줄지**를 정하는 것들
 * (날짜 필터·따라가기)뿐이다.
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
 *
 * ---
 *
 * **상태는 훅 셋으로 나가 있고 이 파일에는 배치와 이동만 남는다**(이슈 #295). 셋을 가른 축은
 * "동선에 담기는 것을 바꾸는가" 다:
 *
 * | 훅 | 맡는 것 | 저장에 닿는가 |
 * |---|---|---|
 * | `useRouteViewPlaces` | 두 모드 분기 · 장소·날짜 길어오기 | 출처 |
 * | `useRoutePlaceSelection` | 끄기·켜기 · 번호 · 날짜 필터 | **닿는다** |
 * | `useRoutePlaceFocus` | 따라가기 · 겹친 묶음 짚어주기 | 안 닿는다 |
 *
 * 페이지에 남긴 셋은 훅으로 못 내리는 것들이다 — 시트 접힘은 **지도가 비워둘 높이**를 재는
 * 값이라 레이아웃이고, `handleNext` 는 navigate 를 부르며, 되돌아갈 곳은 라우팅이다.
 */

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

  const {
    isSavedView,
    pickedDates,
    routeDetail,
    places,
    dates,
    isLoading,
    isError,
    isOffline,
    refetch,
  } = useRouteViewPlaces();

  const {
    disabledIds,
    activePlaces,
    steppablePlaces,
    allVisibleSelected,
    sequenceById,
    dateFilter,
    setDateFilter,
    togglePlace,
    toggleAllVisible,
  } = useRoutePlaceSelection(places, dates);

  const { focusedPlaceId, setFocusedPlaceId, highlightedPlaceIds, handleOverlappingTap } =
    useRoutePlaceFocus({
      places,
      dateFilter,
      onClearDateFilter: () => setDateFilter(null),
    });

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
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70">
          <Spinner label="동선을 불러오는 중..." />
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
            <RouteDateChips dates={dates} filter={dateFilter} onChangeFilter={setDateFilter} />
          </div>
        )}

        <RoutePlaceStrip
          places={places}
          disabledPlaceIds={disabledIds}
          // 값만 넘긴다 — 거르는 칩 줄은 지도 위에 있다(위 헤더 블록 참고).
          dateFilter={dateFilter}
          /*
            ⚠️ **② 저장된 동선 보기에서는 다듬는 조작을 아예 안 넘긴다 — 읽기 전용이다.**
            한동안 두 모드가 이 시트를 통째로 공유해서, 보러 들어온 화면에서도 줄이 눌리고
            `전체 해제` 가 떠 있었다. 그런데 ② 에는 저장하는 자리가 없어(`onNext` 도 안 간다)
            무엇을 빼든 새로고침 한 번에 되돌아왔다. **② 는 오직 보기다** — 거르고
            (`RouteDateChips`) 짚어가는 것(`RouteNodeStepper`)만 남는다.
          */
          allVisibleSelected={isSavedView ? undefined : allVisibleSelected}
          onToggleAllVisible={isSavedView ? undefined : toggleAllVisible}
          // ② 는 저장 한도가 의미 없다 — `3/20개` 는 더 담을 수 있다는 오해를 준다.
          maxPlaces={isSavedView ? undefined : MAX_PLACES}
          // `다음` 이 헤더에서 여기로 내려왔다. 넘어가는 건 이 목록이고 한도(n/20)도 이 줄이
          // 들고 있어서, 지도 반대편 끝에 떨어져 있는 것보다 맥락이 이어진다.
          onNext={isSavedView ? undefined : handleNext}
          onTogglePlace={isSavedView ? undefined : togglePlace}
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
