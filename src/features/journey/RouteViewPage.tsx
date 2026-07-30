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
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

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

  useRoutePath(map, places);

  const toggleDate = (dateKey: string) =>
    setSelectedDates((dates) =>
      dates.includes(dateKey)
        ? dates.filter((date) => date !== dateKey)
        : // 지도·하단바의 순번이 날짜 순서를 따라가도록 항상 오름차순으로 유지한다.
          [...dates, dateKey].sort(),
    );

  const selectFirstDates = () =>
    setSelectedDates([...placeCountByDate.keys()].sort().slice(0, MAX_DATES));

  const handleSave = () => {
    if (places.length === 0) {
      showToast('날짜를 선택하면 동선을 저장할 수 있어요', 'error', { placement: 'top' });
      return;
    }
    if (places.length > MAX_PLACES) {
      showToast(`장소는 ${MAX_PLACES}개까지 저장할 수 있어요`, 'error', { placement: 'top' });
      return;
    }
    setShowSaveSheet(true);
  };

  const handleConfirmSave = () => {
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
          <button
            onClick={handleSave}
            className="rounded-[8px] bg-[#2c3930] px-3 py-1.5 text-[13px] font-medium tracking-wide text-[#fffcef] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          >
            동선저장
          </button>
        </header>

        <div className="pointer-events-auto">
          <RouteDateBar
            selectedDates={selectedDates}
            maxDates={MAX_DATES}
            onOpenDatePicker={() => setShowDateSheet(true)}
            onRemoveDate={toggleDate}
          />
        </div>
      </div>

      <RoutePlaceStrip places={places} maxPlaces={MAX_PLACES} />

      {showDateSheet && (
        <RouteDateSheet
          placeCountByDate={placeCountByDate}
          selectedDates={selectedDates}
          selectedPlaceCount={places.length}
          maxDates={MAX_DATES}
          maxPlaces={MAX_PLACES}
          onToggleDate={toggleDate}
          onSelectFirstDates={selectFirstDates}
          onClearDates={() => setSelectedDates([])}
          onClose={() => setShowDateSheet(false)}
        />
      )}

      {showSaveSheet && (
        <SaveRouteSheet onClose={() => setShowSaveSheet(false)} onConfirm={handleConfirmSave} />
      )}
    </div>
  );
}
