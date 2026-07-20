import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { routePlaces } from './mocks/routePlaces';
import { RouteDateTabs } from './components/RouteDateTabs';
import { RoutePlaceStrip } from './components/RoutePlaceStrip';
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

  const handleConfirmSave = () => {
    setShowSaveSheet(false);
    showToast('동선이 저장되었어요!', 'success', { placement: 'top' });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <button onClick={() => navigate(-1)} aria-label="뒤로가기" className="text-lg">
          &lt;
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-900">동선 보기</h1>
        {selectedDate !== null && (
          <button
            onClick={() => setShowSaveSheet(true)}
            className="rounded-full bg-pictree-700 px-3 py-1.5 text-xs font-medium text-white"
          >
            동선 저장
          </button>
        )}
      </header>

      <RouteDateTabs dates={dates} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* isolate: 카카오맵이 내부 요소에 큰 z-index 를 부여해도 stacking context 를
          가둬서 하단 strip/탭바 등 형제 UI 위로 새어 나오지 않게 한다. */}
      <div ref={containerRef} className="isolate flex-1" />

      <RoutePlaceStrip places={filteredPlaces} />

      {showSaveSheet && (
        <SaveRouteSheet onClose={() => setShowSaveSheet(false)} onConfirm={handleConfirmSave} />
      )}
    </div>
  );
}
