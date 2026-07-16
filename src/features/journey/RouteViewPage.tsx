import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { routePlaces } from './mocks/routePlaces';
import { RouteDateTabs } from './components/RouteDateTabs';
import { RoutePlaceStrip } from './components/RoutePlaceStrip';
import { formatDateLabel } from './lib/formatDate';
import { SaveRouteSheet } from './components/SaveRouteSheet';
import { useToast } from '@/shared/components/toast/toastStore';

export function RouteViewPage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  const dates = useMemo(
    () => [...new Set(routePlaces.map((place) => place.date))],
    [],
  );
  const filteredPlaces = useMemo(
    () => (selectedDate ? routePlaces.filter((place) => place.date === selectedDate) : routePlaces),
    [selectedDate],
  );

  useRoutePath(map, filteredPlaces);

  const stripTitle = selectedDate ? `${formatDateLabel(selectedDate)} 동선` : '전체 동선';

  const handleConfirmSave = () => {
    setShowSaveSheet(false);
    showToast('동선이 저장되었어요!', 'success', { placement: 'top' });
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-white">
      {/* 상단 라임 그린 밴드(rounded-b): 헤더 + 날짜 탭. 지도 위에 떠 있는 카드처럼 보이게 한다. */}
      <div className="relative z-10 rounded-b-[20px] bg-[#c5d89d] pt-safe">
        <header className="flex items-center gap-2 px-5 pt-4">
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
          <h1 className="flex-1 text-xl font-semibold text-[#2c3930]">동선 보기</h1>
          {selectedDate !== null && (
            <button
              onClick={() => setShowSaveSheet(true)}
              className="rounded-[8px] bg-[#fffcef] px-3 py-1 text-sm font-semibold tracking-wide text-[#2c3930]"
            >
              동선저장
            </button>
          )}
        </header>

        <RouteDateTabs dates={dates} selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를
          가둬서 하단 strip/탭바 등 형제 UI 위로 새어 나오지 않게 한다.
          -mt-5: 상단 밴드의 둥근 하단 모서리 아래로 지도가 살짝 비치도록 끌어올린다. */}
      <div ref={containerRef} className="isolate -mt-5 flex-1" />

      <RoutePlaceStrip places={filteredPlaces} title={stripTitle} />

      {showSaveSheet && (
        <SaveRouteSheet onClose={() => setShowSaveSheet(false)} onConfirm={handleConfirmSave} />
      )}
    </div>
  );
}
