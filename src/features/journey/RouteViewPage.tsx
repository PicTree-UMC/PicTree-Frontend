import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../home/hooks/useKakaoMap';
import { useRoutePath } from './hooks/useRoutePath';
import { routePlaces } from './mocks/routePlaces';
import { RouteDateTabs } from './components/RouteDateTabs';
import { RoutePlaceStrip } from './components/RoutePlaceStrip';
import { SaveRouteSheet } from './components/SaveRouteSheet';

export function RouteViewPage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [justSavedDate, setJustSavedDate] = useState<string | null>(null);

  const dates = useMemo(
    () => [...new Set(routePlaces.map((place) => place.date))],
    [],
  );
  const filteredPlaces = useMemo(
    () => (selectedDate ? routePlaces.filter((place) => place.date === selectedDate) : routePlaces),
    [selectedDate],
  );

  useRoutePath(map, filteredPlaces);

  const handleSelectDate = (date: string | null) => {
    setSelectedDate(date);
    setJustSavedDate(null);
  };

  const handleConfirmSave = () => {
    setJustSavedDate(selectedDate);
    setShowSaveSheet(false);
  };

  return (
    <div className="flex h-screen flex-col">
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

      {justSavedDate !== null && justSavedDate === selectedDate ? (
        <div className="px-4 py-3">
          <span className="rounded-full bg-pictree-100 px-3 py-1.5 text-xs font-medium text-pictree-700">
            동선이 저장되었어요!
          </span>
        </div>
      ) : (
        <RouteDateTabs dates={dates} selectedDate={selectedDate} onSelect={handleSelectDate} />
      )}

      <div ref={containerRef} className="flex-1" />

      <RoutePlaceStrip places={filteredPlaces} />

      {showSaveSheet && (
        <SaveRouteSheet onClose={() => setShowSaveSheet(false)} onConfirm={handleConfirmSave} />
      )}
    </div>
  );
}
