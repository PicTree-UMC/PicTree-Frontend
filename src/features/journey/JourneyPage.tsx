import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Journey } from './types/journey';
import { BottomSheet } from './components/BottomSheet';
import { PhotoAlbumSheet } from './components/PhotoAlbumSheet';
import { RenameModal } from './components/RenameModal';
import { useJourneys } from './hooks/useJourneys';
import { useDeleteJourney } from './hooks/useDeleteJourney';
import { useRenameJourney } from './hooks/useRenameJourney';
import { JourneyList } from './components/JourneyList';
import { DeleteModal } from './components/DeleteModal';
import { PremiumBanner } from './components/PremiumBanner';
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

export function JourneyPage() {
  const navigate = useNavigate();
  // 조회는 useQuery, 삭제·이름변경은 useMutation 으로 처리한다.
  const { data: journeys = [], isLoading, isError, refetch } = useJourneys();
  const deleteMutation = useDeleteJourney();
  const renameMutation = useRenameJourney();
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoAlbum, setShowPhotoAlbum] = useState(false);
  /** 앨범에서 되돌아온 경우 바텀시트를 애니메이션 없이 즉시 띄운다. */
  const [animateBottomSheet, setAnimateBottomSheet] = useState(true);

  const handleDelete = () => {
    if (!selectedJourney) return;
    deleteMutation.mutate(selectedJourney.id);
    setShowDeleteModal(false);
    setSelectedJourney(null);
  };

  const handleClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setAnimateBottomSheet(true);
    setShowBottomSheet(true);
  };

  const handleClose = () => {
    setShowBottomSheet(false);
    setSelectedJourney(null);
  };

  const handleRename = (newTitle: string) => {
    if (!selectedJourney) return;
    renameMutation.mutate({ id: selectedJourney.id, title: newTitle });
    setShowRenameModal(false);
    setShowBottomSheet(false);
    setSelectedJourney(null);
  };

  const isEmpty = journeys.length === 0;

  return (
    <div className="flex min-h-full flex-col bg-[#fffcef]">
      {/* 헤더: 세이지 밴드 + 플랜 요약 + 프리미엄 배너 (목록/빈 상태 공통) */}
      <header className="bg-[#c5d89d] px-[31px] pb-4 pt-safe">
        <h1 className="pt-9 text-xl font-bold text-black">저장된 동선</h1>
        <p className="mt-1 text-base font-medium text-black">
          무료플랜{!isLoading && !isError && ` · ${journeys.length}개 저장됨`}
        </p>
        <div className="mt-4">
          <PremiumBanner />
        </div>
      </header>

      {/* 본문: 로딩 → 에러 → 빈 상태 → 목록 순으로 분기 */}
      <div className="flex flex-1 flex-col px-5 py-6">
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
          <div className="flex flex-col gap-[30px]">
            <p className="text-center text-xl font-bold text-[#111]">저장된 동선이 없어요</p>
            <button
              onClick={() => navigate(ROUTES.journeyView)}
              className="mx-auto h-[54px] w-full max-w-[332px] rounded-[24px] bg-[#89986d] text-lg font-bold text-white"
            >
              동선 보기로 이동
            </button>
            <hr className="border-t border-[#c5d89d]" />
            <div className="flex items-center gap-4 rounded-[12px] border-2 border-[#c5d89d] bg-white px-5 py-6">
              <PlusBadge className="size-10 shrink-0" />
              <p className="text-[15px] font-semibold text-[#2c3930]">
                버튼을 눌러서 동선을 저장해 보세요
              </p>
            </div>
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
      </div>

      {showBottomSheet && selectedJourney && (
        <BottomSheet
          journey={selectedJourney}
          onClose={handleClose}
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
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedJourney(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
