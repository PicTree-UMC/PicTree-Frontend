import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from './components/BottomSheet';
import { PhotoAlbumSheet } from './components/PhotoAlbumSheet';
import { RenameModal } from './components/RenameModal';
import { useJourneys } from './hooks/useJourneys';
import { useDeleteJourney } from './hooks/useDeleteJourney';
import { useRenameJourney } from './hooks/useRenameJourney';
import { JourneyChips } from './components/JourneyChips';
import { JourneyRoadmap } from './components/JourneyRoadmap';
import { DeleteModal } from './components/DeleteModal';
import { ROUTES } from '../../shared/constants/routes';

/** 빈 상태 안내 카드 아이콘(디자인 octicon:feed-plus-16). 인라인 SVG. */
function PlusBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#89986d" />
      <path d="M20 12v16M12 20h16" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** 더보기(⋯) 아이콘 — 선택된 동선의 액션 시트를 연다. */
function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

/** 삭제 버튼 안 휴지통 아이콘(디자인 ix:trashcan). 인라인 SVG. */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function JourneyPage() {
  const navigate = useNavigate();
  // 조회는 useQuery, 삭제·이름변경은 useMutation 으로 처리한다.
  const { data: journeys = [], isLoading, isError, refetch } = useJourneys();
  const deleteMutation = useDeleteJourney();
  const renameMutation = useRenameJourney();
  // 칩으로 선택된 동선. 로드맵·액션 시트·삭제 모두 이 동선을 대상으로 한다.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoAlbum, setShowPhotoAlbum] = useState(false);
  /** 앨범에서 되돌아온 경우 바텀시트를 애니메이션 없이 즉시 띄운다. */
  const [animateBottomSheet, setAnimateBottomSheet] = useState(true);

  // 목록이 로드되거나 선택한 동선이 삭제되면 첫 동선으로 선택을 맞춘다.
  useEffect(() => {
    if (journeys.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (selectedId === null || !journeys.some((journey) => journey.id === selectedId)) {
      setSelectedId(journeys[0].id);
    }
  }, [journeys, selectedId]);

  const selectedJourney = journeys.find((journey) => journey.id === selectedId) ?? null;

  const handleDelete = () => {
    if (!selectedJourney) return;
    deleteMutation.mutate(selectedJourney.id);
    setShowDeleteModal(false);
  };

  const handleRename = (newTitle: string) => {
    if (!selectedJourney) return;
    renameMutation.mutate({ id: selectedJourney.id, title: newTitle });
    setShowRenameModal(false);
    setShowBottomSheet(false);
  };

  const isEmpty = journeys.length === 0;

  return (
    <div className="flex min-h-full flex-col bg-[#fffcef]">
      <div className="flex flex-1 flex-col px-5 pb-6 pt-safe">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#89986d]" />
            <p className="text-[15px] font-medium text-[#5c6f2b]">동선을 불러오는 중...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-center text-[15px] font-semibold text-[#2c3930]">
              동선을 불러오지 못했어요
            </p>
            <button
              onClick={() => refetch()}
              className="h-[46px] rounded-[24px] bg-[#89986d] px-8 text-base font-bold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col justify-center gap-[30px]">
            <p className="text-center text-xl font-bold text-[#111]">저장된 동선이 없어요</p>
            <button
              onClick={() => navigate(ROUTES.journeyView)}
              className="mx-auto h-[54px] w-full max-w-[332px] rounded-[24px] bg-[#89986d] text-lg font-bold text-white"
            >
              동선 보기로 이동
            </button>
            <div className="flex items-center gap-4 rounded-[12px] border-2 border-[#c5d89d] bg-white px-5 py-6">
              <PlusBadge className="size-10 shrink-0" />
              <p className="text-[15px] font-semibold text-[#2c3930]">
                버튼을 눌러서 동선을 저장해 보세요
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 칩 셀렉터: 저장된 동선 중 하나를 고른다. */}
            <div className="pt-4">
              <JourneyChips
                journeys={journeys}
                selectedId={selectedId}
                onSelect={(journey) => setSelectedId(journey.id)}
              />
            </div>

            {selectedJourney && (
              <>
                {/* 선택 동선 메타 + 액션(더보기 / 삭제) */}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#2c3930]">{selectedJourney.date}</p>
                    <p className="text-[11px] font-light text-[#8d8d8d]">
                      {selectedJourney.placeCount}개 장소
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => {
                        setAnimateBottomSheet(true);
                        setShowBottomSheet(true);
                      }}
                      aria-label="동선 더보기"
                      className="flex size-9 items-center justify-center rounded-full border border-[#c5d89d] bg-white text-[#2c3930]"
                    >
                      <MoreIcon className="size-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      aria-label="동선 삭제"
                      className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-[#ff9797] text-[#ff9797]"
                    >
                      <TrashIcon className="size-[18px]" />
                    </button>
                  </div>
                </div>

                {/* 로드맵: 장소 이동을 사진 노드 + 점선으로 표현.
                    key 로 동선이 바뀔 때마다 등장 애니메이션을 다시 재생한다. */}
                <div className="mt-6">
                  <JourneyRoadmap key={selectedJourney.id} journey={selectedJourney} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showBottomSheet && selectedJourney && (
        <BottomSheet
          journey={selectedJourney}
          onClose={() => setShowBottomSheet(false)}
          animateIn={animateBottomSheet}
          onMapView={() => navigate(ROUTES.journeyView)}
          onPhotoGallery={() => {
            setShowBottomSheet(false);
            setShowPhotoAlbum(true);
          }}
          // TODO: 블로그 화면(현재 스텁) 구현 후 연결
          onAIBlog={() => {}}
          onRename={() => {
            setShowBottomSheet(false);
            setShowRenameModal(true);
          }}
        />
      )}

      {showPhotoAlbum && selectedJourney && (
        <PhotoAlbumSheet
          journey={selectedJourney}
          onClose={() => {
            setShowPhotoAlbum(false);
            setAnimateBottomSheet(false);
            setShowBottomSheet(true);
          }}
        />
      )}

      {showRenameModal && selectedJourney && (
        <RenameModal
          currentTitle={selectedJourney.title}
          onClose={() => setShowRenameModal(false)}
          onConfirm={handleRename}
        />
      )}
      {showDeleteModal && selectedJourney && (
        <DeleteModal
          journeyTitle={selectedJourney.title}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
