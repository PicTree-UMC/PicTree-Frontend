import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouteMenuSheet } from './components/RouteMenuSheet';
import { PhotoAlbumSheet } from './components/PhotoAlbumSheet';
import { RenameModal } from './components/RenameModal';
import { useSavedRoutes } from './hooks/useSavedRoutes';
import { useDeleteRoute } from './hooks/useDeleteRoute';
import { useRenameRoute } from './hooks/useRenameRoute';
import { RouteTray } from './components/RouteTray';
import { RouteListSkeleton } from './components/RouteListSkeleton';
import { RouteIllustration } from './components/RouteIllustration';
import { SavedRouteRoadmap } from './components/RouteRoadmap';
import { ROUTES, journeyViewPath } from '../../shared/constants/routes';
import { DeleteConfirmModal } from '../../shared/components/DeleteConfirmModal';

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

export function RouteListPage() {
  const navigate = useNavigate();
  // 조회는 useQuery, 삭제·이름변경은 useMutation 으로 처리한다.
  const { data: routes = [], isLoading, isError, refetch } = useSavedRoutes();
  const deleteMutation = useDeleteRoute();
  const renameMutation = useRenameRoute();
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
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoAlbum, setShowPhotoAlbum] = useState(false);
  /** 앨범에서 되돌아온 경우 바텀시트를 애니메이션 없이 즉시 띄운다. */
  const [animateMenuSheet, setAnimateMenuSheet] = useState(true);

  // 목록이 로드되거나 선택한 동선이 삭제되면 첫 동선으로 선택을 맞춘다.
  useEffect(() => {
    if (routes.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }

    // 방금 저장한 동선이 목록에 도착했으면 그걸 고른다.
    if (pendingSelectId !== null && routes.some((route) => route.id === pendingSelectId)) {
      setSelectedId(pendingSelectId);
      setPendingSelectId(null);
      return;
    }

    // 아직 안 왔어도 선택은 비우지 않는다 — 목록이 잠깐 아무것도 안 고른 채로 보이면
    // 저장이 실패한 것처럼 읽힌다. 도착하면 위 분기가 갈아끼운다.
    if (selectedId === null || !routes.some((route) => route.id === selectedId)) {
      setSelectedId(routes[0].id);
    }
  }, [routes, selectedId, pendingSelectId]);

  const selectedRoute = routes.find((route) => route.id === selectedId) ?? null;

  const handleDelete = () => {
    if (!selectedRoute) return;
    deleteMutation.mutate(selectedRoute.id, {
      onSuccess: () => setShowDeleteModal(false),
    });
  };

  const handleRename = (newTitle: string) => {
    if (!selectedRoute) return;
    renameMutation.mutate({ id: selectedRoute.id, title: newTitle });
    setShowRenameModal(false);
    setShowMenuSheet(false);
  };

  const isEmpty = routes.length === 0;

  return (
    <div className="flex min-h-full flex-col bg-cream">
      {/* pb: 탭바가 콘텐츠 위에 얹히므로 마지막 항목이 가려지지 않을 만큼 띄운다 */}
      <div className="flex flex-1 flex-col px-5 pb-nav pt-header">
        {isLoading ? (
          <RouteListSkeleton />
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-center text-[15px] font-semibold text-ink">
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
            <RouteIllustration className="w-[200px]" />
            <h2
              className="animate-fade-in-up mt-6 text-[17px] font-medium text-ink"
              style={{ animationDelay: '600ms' }}
            >
              아직 저장된 동선이 없어요
            </h2>
            <p
              className="animate-fade-in-up mt-2 text-[15px] leading-6 text-ink-muted"
              style={{ animationDelay: '600ms' }}
            >
              여행하며 다녀온 장소들을 이어
              <br />
              나만의 여행 발자국을 남겨보세요.
            </p>
            <button
              onClick={() => navigate(ROUTES.journeyCreate)}
              className="animate-fade-in-up mt-8 h-[46px] rounded-[24px] bg-pictree-700 px-7 text-[15px] font-medium text-white"
              style={{ animationDelay: '750ms' }}
            >
              동선 생성하기
            </button>
          </div>
        ) : (
          <>
            {/* 트레이: 저장된 동선 중 하나를 고른다. */}
            <div className="pt-4">
              <RouteTray
                routes={routes}
                selectedId={selectedId}
                onSelect={(route) => setSelectedId(route.id)}
                // 빈 상태의 '동선 생성하기' CTA 는 목록이 차면 사라진다 — 그때부터
                // 새 동선을 만들 입구가 아예 없었다. 트레이 첫 칸이 그 자리를 잇는다.
                onCreate={() => navigate(ROUTES.journeyCreate)}
              />
            </div>

            {selectedRoute && (
              <>
                {/*
                  선택 동선 메타 + 더보기.

                  **삭제 버튼이 여기 있었다.** 동선에 걸 수 있는 동작 다섯 중 넷은 시트를
                  열어야 보이는데 삭제만 목록 옆에 상시로 떠 있어서, 가장 위험한 것이 가장
                  누르기 쉬운 자리를 차지하고 있었다. 지금은 시트 맨 아래 ERROR 줄이다.

                  장소 수는 11px light 였다 — 최소 13px 이고 굵기는 regular·medium 만 쓴다(§2).
                */}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">{selectedRoute.date}</p>
                    <p className="text-[13px] text-ink-muted">{selectedRoute.placeCount}개 장소</p>
                  </div>
                  <button
                    onClick={() => {
                      setAnimateMenuSheet(true);
                      setShowMenuSheet(true);
                    }}
                    aria-label="동선 더보기"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-pictree-300 bg-white text-ink"
                  >
                    <MoreIcon className="size-5" />
                  </button>
                </div>

                {/* 로드맵: 장소 이동을 사진 노드 + 점선으로 표현.
                    key 로 동선이 바뀔 때마다 등장 애니메이션을 다시 재생한다. */}
                <div className="mt-6">
                  <SavedRouteRoadmap key={selectedRoute.id} route={selectedRoute} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showMenuSheet && selectedRoute && (
        <RouteMenuSheet
          route={selectedRoute}
          onClose={() => setShowMenuSheet(false)}
          animateIn={animateMenuSheet}
          onMapView={() => navigate(journeyViewPath(selectedRoute.id))}
          onPhotoGallery={() => {
            setShowMenuSheet(false);
            setShowPhotoAlbum(true);
          }}
          // AI 블로그 작성 플로우로 이동. **이 동선 자체**를 넘긴다 — 초안 입력 단위가
          // 기간에서 동선으로 바뀌면서(이슈 #212) 작성 화면 1단계가 이미 정해진 셈이 된다.
          // 기간은 거기서 동선 상세로 도로 뽑으므로 여기서 계산해 넘길 것이 없다.
          onAIBlog={() => {
            setShowMenuSheet(false);
            navigate(ROUTES.blogCreate, { state: { routeId: selectedRoute.id } });
          }}
          onRename={() => {
            setShowMenuSheet(false);
            setShowRenameModal(true);
          }}
          /*
            시트를 닫고 확인 모달로 넘긴다. **시트를 열어둔 채 모달을 얹지 않는다** —
            층이 둘 겹치면 모달을 닫았을 때 무엇이 남는지가 흐려지고, 확인 모달은
            자기 말고 다른 것이 화면에 남을 이유가 없는 자리다.
          */
          onDelete={() => {
            setShowMenuSheet(false);
            setShowDeleteModal(true);
          }}
        />
      )}

      {showPhotoAlbum && selectedRoute && (
        <PhotoAlbumSheet
          route={selectedRoute}
          onClose={() => {
            setShowPhotoAlbum(false);
            setAnimateMenuSheet(false);
            setShowMenuSheet(true);
          }}
        />
      )}

      {showRenameModal && selectedRoute && (
        <RenameModal
          currentTitle={selectedRoute.title}
          onClose={() => setShowRenameModal(false)}
          onConfirm={handleRename}
        />
      )}
      {selectedRoute && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="동선을 삭제할까요?"
          description={`“${selectedRoute.title}”이(가) 영구 삭제됩니다.`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
