import { useState } from 'react';
import { Journey } from './types/journey';
import { BottomSheet } from './components/BottomSheet';
import { RenameModal } from './components/RenameModal';
import { journeyData } from './mocks/journeyData';
import { JourneyList } from './components/JourneyList';
import { DeleteModal } from './components/DeleteModal';

export function JourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>(journeyData);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    if (!selectedJourney) return;
    setJourneys((prev) => prev.filter((journey) => journey.id !== selectedJourney.id));
    setShowDeleteModal(false);
    setSelectedJourney(null);
  };

  const handleClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowBottomSheet(true);
  };

  const handleClose = () => {
    setShowBottomSheet(false);
    setSelectedJourney(null);
  };

  const handleRename = (newTitle: string) => {
    setJourneys((prev) =>
      prev.map((journey) =>
        journey.id === selectedJourney?.id ? { ...journey, title: newTitle } : journey,
      ),
    );
    setShowRenameModal(false);
    setShowBottomSheet(false);
    setSelectedJourney(null);
  };

  return (
    <div className="flex flex-col gap-3 p-5 pb-24">
      <h1 className="text-xl font-bold text-gray-900">저장된 동선</h1>

      {journeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
          <p className="text-gray-400">저장된 동선이 없어요</p>
          <button className="rounded-full bg-green-500 px-5 py-2 text-sm text-white">
            동선 보기로 이동
          </button>
        </div>
      ) : (
        <JourneyList
          journeys={journeys}
          onDelete={(journey) => {
            setSelectedJourney(journey);
            setShowDeleteModal(true);
          }}
          onClick={handleClick}
        />
      )}

      {showBottomSheet && selectedJourney && (
        <BottomSheet
          journey={selectedJourney}
          onClose={handleClose}
          onMapView={() => {}}
          onPhotoGallery={() => {}}
          onAIBlog={() => {}}
          onRename={() => {
            setShowBottomSheet(false);
            setShowRenameModal(true);
          }}
        />
      )}

      {showRenameModal && selectedJourney && (
        <RenameModal
          isOpen={showRenameModal}
          currentTitle={selectedJourney?.title ?? ''}
          onClose={() => setShowRenameModal(false)}
          onConfirm={handleRename}
        />
      )}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
