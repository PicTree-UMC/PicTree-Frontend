import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { routePlaces } from './mocks/routePlaces';
import { RouteDateBar } from './components/RouteDateBar';
import { RouteDateSheet } from './components/RouteDateSheet';
import { RoutePlaceStrip } from './components/RoutePlaceStrip';
import { SaveRouteSheet } from './components/SaveRouteSheet';
import { useToast } from '@/shared/components/toast/toastStore';

/** 화면설계서 0번: 한 번에 고를 수 있는 날짜는 3일, 저장할 수 있는 장소는 20개까지. */
const MAX_DATES = 3;
const MAX_PLACES = 20;

export function RouteViewPage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap();
  const { showToast } = useToast();
  // 시안의 기본 상태는 '아무 날짜도 안 고른 상태'다. 전체 동선을 미리 그려주지 않는다
  // — 날짜를 골라야 지도에 동선이 뜬다(화면설계서 2번).
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // 하단바에서 꺼둔 장소(설계서 7번). 목록에는 남기고 번호·개수·동선에서만 뺀다.
  const [disabledPlaceIds, setDisabledPlaceIds] = useState<number[]>([]);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  // 저장한 시점의 동선 구성. 저장 여부를 boolean 으로 들면 저장 뒤에 날짜·장소를 바꿔도
  // '저장됨' 이 그대로 남아 안 저장된 동선을 저장했다고 말하게 된다(설계서 8번).
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  // 캘린더가 '나무를 심은 날짜 + 그날 장소 수'를 요구한다(설계서 1번).
  // 실 연동에서는 /timelines ⋈ /trees 조인 결과가 이 자리에 들어온다.
  const placeCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    routePlaces.forEach((place) => counts.set(place.date, (counts.get(place.date) ?? 0) + 1));
    return counts;
  }, []);

  const places = useMemo(
    () => routePlaces.filter((place) => selectedDates.includes(place.date)),
    [selectedDates],
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
        selectedDates.filter((date) => {
          const ofDate = places.filter((place) => place.date === date);
          return ofDate.length > 0 && ofDate.every((place) => disabledIds.has(place.id));
        }),
      ),
    [selectedDates, places, disabledIds],
  );

  // 켜져 있는 장소와 그 순서가 곧 저장 대상이다 — 하나라도 달라지면 '저장됨' 이 풀린다.
  const signature = activePlaces.map((place) => place.id).join(',');
  const isSaved = savedSignature !== null && savedSignature === signature;

  useRoutePath(map, places, disabledIds);

  const toggleDate = (dateKey: string) => {
    setSelectedDates((dates) =>
      dates.includes(dateKey)
        ? dates.filter((date) => date !== dateKey)
        : // 지도·하단바의 순번이 날짜 순서를 따라가도록 항상 오름차순으로 유지한다.
          [...dates, dateKey].sort(),
    );
    // 날짜가 빠지면 그 날짜에서 껐던 기억도 지운다 — 다시 고르면 전부 켜진 상태로 돌아온다.
    // (안 지우면 며칠 전에 끈 장소가 되살아난 날짜에서 소리 없이 빠져 있다.)
    setDisabledPlaceIds((ids) =>
      ids.filter((id) => routePlaces.find((place) => place.id === id)?.date !== dateKey),
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
    setSelectedDates([...placeCountByDate.keys()].sort().slice(0, MAX_DATES));
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
    // TODO(#35): POST /routes 연동. 지금은 목이라 화면 상태만 바꾼다.
    //   이름과 `activePlaces` 가 그대로 요청 본문이 되는 자리다.
    void name;
    setSavedSignature(signature);
    setShowSaveSheet(false);
    showToast('동선이 저장되었어요!', 'success', { placement: 'top' });
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* 지도가 헤더 뒤 상태바까지 올라오는 게 시안이다(예전의 라임 그린 밴드는 없어졌다).
          isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를 가둬서
          하단 strip 등 형제 UI 위로 새어 나오지 않게 한다. */}
      <div ref={containerRef} className="isolate flex-1" />

      {/* 헤더와 날짜 관리 바는 지도 위에 떠 있다. 지도 영역을 깎지 않도록 absolute. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-safe">
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
          <h1 className="flex-1 text-xl font-medium text-[#2c3930]">동선 보기</h1>
          {/* 저장 뒤에는 '저장됨' 으로 바뀌고 눌리지 않는다(설계서 8번). 색은 그대로 두는 게
              시안이다 — 흐려두면 저장이 실패한 것처럼 보인다. */}
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="rounded-[8px] bg-[#2c3930] px-3 py-1.5 text-[13px] font-medium tracking-wide text-[#fffcef] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          >
            {isSaved ? '저장됨' : '동선저장'}
          </button>
        </header>

        <div className="pointer-events-auto">
          <RouteDateBar
            selectedDates={selectedDates}
            disabledDates={disabledDates}
            maxDates={MAX_DATES}
            onOpenDatePicker={() => setShowDateSheet(true)}
            onToggleDate={toggleDateActive}
          />
        </div>
      </div>

      <RoutePlaceStrip
        places={places}
        disabledPlaceIds={disabledIds}
        maxPlaces={MAX_PLACES}
        onTogglePlace={togglePlace}
      />

      {showDateSheet && (
        <RouteDateSheet
          placeCountByDate={placeCountByDate}
          selectedDates={selectedDates}
          selectedPlaceCount={activePlaces.length}
          maxDates={MAX_DATES}
          maxPlaces={MAX_PLACES}
          onToggleDate={toggleDate}
          onSelectFirstDates={selectFirstDates}
          onClearDates={() => {
            setSelectedDates([]);
            setDisabledPlaceIds([]);
          }}
          onClose={() => setShowDateSheet(false)}
        />
      )}

      {showSaveSheet && (
        <SaveRouteSheet onClose={() => setShowSaveSheet(false)} onConfirm={handleConfirmSave} />
      )}
    </div>
  );
}
