import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomSheet } from './components/BottomSheet';
import { PhotoAlbumSheet } from './components/PhotoAlbumSheet';
import { RenameModal } from './components/RenameModal';
import { useJourneys } from './hooks/useJourneys';
import { useDeleteJourney } from './hooks/useDeleteJourney';
import { useRenameJourney } from './hooks/useRenameJourney';
import { JourneyChips } from './components/JourneyChips';
import { JourneyRoadmap } from './components/JourneyRoadmap';
import { DeleteModal } from './components/DeleteModal';
import { ROUTES, journeyViewPath } from '../../shared/constants/routes';

/**
 * 저장된 동선이 없을 때 보여주는 감성 일러스트.
 * 점선으로 이어진 동선 위에 출발점·장소 핀·도착 나무를 얹어 "장소를 이어 발자국을 남긴다"를 표현한다.
 */
/**
 * 빈 화면 일러스트 — 여행이 만들어지는 순서대로 살아난다.
 *
 * 출발점이 콕 찍히고 → 점선 경로가 발자국처럼 이어지고 → 중간 핀이 떨어지고 →
 * 도착 나무가 자란다. "장소를 이어 동선을 만든다"는 아래 문구를 그림이 재연한다.
 *
 * 점선은 stroke-dashoffset 을 직접 감지 않는다 — 점선에 offset 을 걸면 점들이
 * 기어가는 것처럼 보인다. 대신 같은 경로의 굵은 선을 mask 로 감아 **드러낸다**.
 */
function EmptyJourneyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={className} fill="none" aria-hidden>
      <defs>
        <mask id="journey-empty-reveal">
          <path
            className="animate-journey-path"
            d="M34 118 Q 68 116 92 94 T 168 60"
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>
      {/* 출발 지점 */}
      <circle
        className="animate-journey-dot"
        cx="34"
        cy="118"
        r="6.5"
        fill="#fffcef"
        stroke="#788f4a"
        strokeWidth="3"
      />
      {/* 점선 동선 경로: mask 가 감기며 출발점부터 차례로 드러난다 */}
      <g mask="url(#journey-empty-reveal)">
        <path
          d="M34 118 Q 68 116 92 94 T 168 60"
          stroke="#c5d89d"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 12"
        />
      </g>
      {/* 중간 장소 핀 (뾰족한 끝이 경로 위에 놓인다) — 위에서 떨어진다 */}
      <g className="animate-journey-pin">
        <path
          d="M92 54a15 15 0 0 0-15 15c0 10.5 15 25 15 25s15-14.5 15-25a15 15 0 0 0-15-15z"
          fill="#788f4a"
        />
        <circle cx="92" cy="69" r="6" fill="#fffcef" />
      </g>
      {/* 도착: 나무 — 밑동에서 자란다 */}
      <g className="animate-journey-tree">
        <rect x="165" y="48" width="6" height="16" rx="3" fill="#788f4a" />
        <circle cx="168" cy="40" r="14" fill="#c5d89d" />
        <circle cx="168" cy="40" r="7" fill="#788f4a" opacity="0.3" />
      </g>
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
  /**
   * 동선을 막 저장하고 넘어왔을 때 골라줄 id (`RouteViewPage` 가 navigate state 로 넘긴다).
   *
   * 바로 `selectedId` 로 넣지 않는 이유는 **그 동선이 아직 목록에 없기 때문**이다 —
   * 저장 직후 목록 무효화가 끝나기 전에 이 화면이 뜬다. 목록에 들어올 때까지 들고 있다가
   * 그때 고르고 비운다.
   */
  const navigationState = useLocation().state as { selectedRouteId?: number } | null;
  const [pendingSelectId, setPendingSelectId] = useState<number | null>(
    navigationState?.selectedRouteId ?? null,
  );
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

    // 방금 저장한 동선이 목록에 도착했으면 그걸 고른다.
    if (pendingSelectId !== null && journeys.some((journey) => journey.id === pendingSelectId)) {
      setSelectedId(pendingSelectId);
      setPendingSelectId(null);
      return;
    }

    // 아직 안 왔어도 선택은 비우지 않는다 — 목록이 잠깐 아무것도 안 고른 채로 보이면
    // 저장이 실패한 것처럼 읽힌다. 도착하면 위 분기가 갈아끼운다.
    if (selectedId === null || !journeys.some((journey) => journey.id === selectedId)) {
      setSelectedId(journeys[0].id);
    }
  }, [journeys, selectedId, pendingSelectId]);

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
      {/* pb: 탭바가 콘텐츠 위에 얹히므로 마지막 항목이 가려지지 않을 만큼 띄운다 */}
      <div className="flex flex-1 flex-col px-5 pb-nav pt-header">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
            <p className="text-[15px] font-medium text-pictree-700">동선을 불러오는 중...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-center text-[15px] font-semibold text-[#2c3930]">
              동선을 불러오지 못했어요
            </p>
            <button
              onClick={() => refetch()}
              className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-base font-bold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            {/* 그림 안 요소가 스스로 순서대로 살아난다(약 1.3초). 문구·CTA 는
                그림이 끝날 즈음 떠오른다 — 그림보다 먼저 뜨면 이야기 순서가 꼬인다. */}
            <EmptyJourneyIllustration className="w-[200px]" />
            <h2
              className="animate-fade-in-up mt-6 text-[17px] font-medium text-[#2c3930]"
              style={{ animationDelay: '600ms' }}
            >
              아직 저장된 동선이 없어요
            </h2>
            <p
              className="animate-fade-in-up mt-2 text-[15px] leading-6 text-[#60655c]"
              style={{ animationDelay: '600ms' }}
            >
              여행하며 다녀온 장소들을 이어
              <br />
              나만의 여행 발자국을 남겨보세요.
            </p>
            <button
              onClick={() => navigate(ROUTES.journeyCreate)}
              className="animate-fade-in-up mt-8 h-[52px] w-full max-w-[320px] rounded-[24px] bg-pictree-700 text-[15px] font-medium text-white"
              style={{ animationDelay: '750ms' }}
            >
              동선 생성하기
            </button>
          </div>
        ) : (
          <>
            {/* 칩 셀렉터: 저장된 동선 중 하나를 고른다. */}
            <div className="pt-4">
              <JourneyChips
                journeys={journeys}
                selectedId={selectedId}
                onSelect={(journey) => setSelectedId(journey.id)}
                // 빈 상태의 '동선 생성하기' CTA 는 목록이 차면 사라진다 — 그때부터
                // 새 동선을 만들 입구가 아예 없었다. 칩 줄의 + 가 그 자리를 잇는다.
                onCreate={() => navigate(ROUTES.journeyCreate)}
              />
            </div>

            {selectedJourney && (
              <>
                {/* 선택 동선 메타 + 액션(더보기 / 삭제) */}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#2c3930]">{selectedJourney.date}</p>
                    <p className="text-[11px] font-light text-[#60655c]">
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
                      className="flex size-9 items-center justify-center rounded-full border border-pictree-300 bg-white text-[#2c3930]"
                    >
                      <MoreIcon className="size-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      aria-label="동선 삭제"
                      className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-[#dc2626] text-[#dc2626]"
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
          onMapView={() => navigate(journeyViewPath(selectedJourney.id))}
          onPhotoGallery={() => {
            setShowBottomSheet(false);
            setShowPhotoAlbum(true);
          }}
          // AI 블로그 작성 플로우로 이동. 이 동선의 방문 기간을 미리 채워 넘긴다
          // (기록이 없으면 recordDates 가 빈 배열 — 그때는 작성 화면 기본값을 쓴다).
          onAIBlog={() => {
            setShowBottomSheet(false);
            const dates = [...selectedJourney.recordDates].sort();
            const initialStartDate = dates[0];
            const initialEndDate = dates[dates.length - 1];
            navigate(ROUTES.blogCreate, {
              state: initialStartDate && initialEndDate
                ? { startDate: initialStartDate, endDate: initialEndDate }
                : undefined,
            });
          }}
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
