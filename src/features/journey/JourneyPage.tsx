import { useState } from 'react';
import { Journey } from './types/journey';
import { JourneyCard } from './components/JourneyCard';
import { journeyData } from '../../mocks/journeyData';
import { BottomSheet } from './components/BottomSheet';

export function JourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>(journeyData);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const handleDelete = (id: number) => {
    setJourneys(prev => prev.filter(journey => journey.id !== id));
  };

  const handleClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowBottomSheet(true);
  };

  const handleClose = () => {
    setShowBottomSheet(false);
    setSelectedJourney(null);
  };

return (
  <div className="flex flex-col gap-3 p-5">
    <h1 className="text-xl font-bold text-gray-900">저장된 동선</h1>
    {journeys.length === 0 ? (
        // 빈 상태
        <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
          <p className="text-gray-400">저장된 동선이 없어요</p>
          <button className="rounded-full bg-green-500 px-5 py-2 text-sm text-white">
            동선 보기로 이동
          </button>
        </div>
      ) : (
        // 카드 리스트
        journeys.map(journey => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onDelete={handleDelete}
            onClick={handleClick}
          />
        ))
      )}
            {showBottomSheet && selectedJourney && (
        <BottomSheet
          journey={selectedJourney}
          onClose={handleClose}
          onMapView={() => {}}
          onPhotoGallery={() => {}}
          onAIBlog={() => {}}
          onRename={() => {}}
        />
      )}
  </div>
);
}