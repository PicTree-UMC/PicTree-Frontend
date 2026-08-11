import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouteMenuSheet } from './components/RouteMenuSheet';
import { RenameModal } from './components/RenameModal';
import { useSavedRoutes } from './hooks/useSavedRoutes';
import { useDeleteRoute } from './hooks/useDeleteRoute';
import { useRenameRoute } from './hooks/useRenameRoute';
import { RouteTray } from './components/RouteTray';
import { RouteListSkeleton } from './components/RouteListSkeleton';
import { RouteIllustration } from './components/RouteIllustration';
import { SavedRouteRoadmap } from './components/RouteRoadmap';
import { RouteInlineMap } from './components/RouteInlineMap';
import { RoutePhotoAlbum } from './components/RoutePhotoAlbum';
import { BlogCreateFab } from '../blog/components/BlogCreateFab';
import { RouteViewPicker, type RouteViewMode } from './components/RouteViewPicker';
import { ROUTES, journeyViewPath } from '../../shared/constants/routes';
import { DeleteConfirmModal } from '../../shared/components/DeleteConfirmModal';

/**
 * 메뉴 아이콘 — 선택된 동선의 액션 시트를 연다(lucide:list-sort-descending).
 *
 * **점 셋(⋯)이었다.** 인스타그램 게시물 헤더가 쓰는 계단형 줄 아이콘으로 바꿨다 — 점 셋은
 * '더 있다'까지만 말하는데, 이 글리프는 목록이 딸려 나온다는 것까지 말한다.
 * 흰 원 + 초록 테두리를 두르고 있었지만 **면을 없앴다**: 크림 페이지에서 유일하게 테두리를
 * 두른 요소라 옆의 피커보다 먼저 눈에 걸렸다. 지금은 회색 글리프 하나다.
 */
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 5h18M3 12h12M3 19h6" />
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
  /**
   * 고른 동선을 로드맵으로 볼지 지도로 볼지. **동선을 바꿔도 유지된다**(피커 주석 참고).
   *
   * 지도는 좌표가 필요해 상세를 따로 받아야 하므로(`RouteInlineMap`), 로드맵으로 두는
   * 동안에는 그 요청이 아예 나가지 않는다 — 기본값이 로드맵인 이유이기도 하다.
   */
  const [viewMode, setViewMode] = useState<RouteViewMode>('roadmap');
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                  선택 동선 메타 + 보기 피커 + 메뉴.

                  **삭제 버튼이 여기 있었다.** 동선에 거는 다른 동작은 전부 시트를 열어야
                  보이는데 삭제만 목록 옆에 상시로 떠 있어서, 가장 위험한 것이 가장 누르기
                  쉬운 자리를 차지하고 있었다. 지금은 시트 맨 아래 ERROR 줄이다.

                  반대로 **`지도에서 보기` 는 시트에서 나와 이 줄의 피커가 됐다** — 그건
                  동선에 무언가를 하는 게 아니라 같은 동선을 다른 방식으로 보는 일이라,
                  로드맵과 나란히 서야 둘이 대등해진다.

                  **`n개 장소` 줄은 뺐다.** 13px 두 줄이 38px 짜리 피커 옆에서 잔글씨로 눌렸고,
                  장소 수는 바로 아래 로드맵이 번호로, 지도가 마커로 이미 세어 보여준다
                  (숫자 자체가 필요하면 메뉴 시트 머리에 날짜와 함께 남아 있다).
                  한 줄이 된 날짜는 13 → 17px medium 으로 올렸다.
                */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  {/* 여러 날에 걸친 동선은 '2026년 3월 31일 ~ 4월 1일' 처럼 길어진다. 잘라내지
                      않고 두 줄로 흐르게 둔다 — 끝을 자르면 하필 '언제까지'가 사라진다. */}
                  <p className="min-w-0 text-[17px] font-medium text-ink">{selectedRoute.date}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* 보기 방식은 동선을 바꿔도 유지한다 — 지도로 훑어보던 사람은 다음
                        동선도 지도로 보려던 참이다. 되돌리면 두 번째 동선부터 매번 다시 누른다. */}
                    <RouteViewPicker value={viewMode} onChange={setViewMode} />
                    <button
                      onClick={() => setShowMenuSheet(true)}
                      aria-label="동선 메뉴"
                      className="flex size-9 items-center justify-center rounded-full text-ink-muted active:bg-cream-sub"
                    >
                      <MenuIcon className="size-[22px]" />
                    </button>
                  </div>
                </div>

                {/* 로드맵 ↔ 지도. 피커가 이 자리를 갈아끼운다.
                    로드맵은 key 로 동선이 바뀔 때마다 등장 애니메이션을 다시 재생한다.
                    지도도 key 를 받는다 — 동선이 바뀌면 지도 인스턴스를 새로 세워, 이전
                    동선을 보던 배율·중심이 남아 있지 않게 한다. */}
                <div className="mt-6">
                  {viewMode === 'roadmap' ? (
                    <SavedRouteRoadmap key={selectedRoute.id} route={selectedRoute} />
                  ) : (
                    <RouteInlineMap
                      key={selectedRoute.id}
                      routeId={selectedRoute.id}
                      onExpand={() => navigate(journeyViewPath(selectedRoute.id))}
                    />
                  )}
                </div>

                {/* 사진 앨범. **메뉴 시트의 줄이었다** — 사진은 이 동선이 어떤 여행이었는지
                    가장 잘 말해 주는 것인데 메뉴를 열어야 닿았다. 로드맵/지도 아래에 두면
                    고른 동선을 훑는 흐름(날짜 → 지도 → 사진) 안에 그대로 들어온다.
                    key 로 동선이 바뀌면 보던 장을 첫 장으로 되돌린다. */}
                <div className="mt-8">
                  <RoutePhotoAlbum key={selectedRoute.id} routeId={selectedRoute.id} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/*
        AI 블로그 작성. **메뉴 시트의 줄이었다** — 접혀 있는 동안에는 이 앱이 동선으로
        블로그를 써 준다는 것 자체가 화면에 없었다. 블로그 탭과 **같은 버튼**을 쓴다
        (`BlogCreateFab`): 이달 잔량이 0 이면 결제 시트로 가로채는 판단이 그 안에 있어서,
        여기에 따로 만들면 한쪽만 한도를 안 보게 된다.

        글자를 곁들인 알약이다 — 동선 탭에는 '새 동선' 입구가 따로 있어서, 초록 원 하나로는
        무엇을 만드는 버튼인지 갈린다.

        **고른 동선이 있을 때만 뜬다.** 이 버튼이 넘기는 건 그 동선이라, 목록이 비었거나
        아직 안 불러온 화면에서는 넘길 것이 없다.
      */}
      {selectedRoute && <BlogCreateFab routeId={selectedRoute.id} label="AI 블로그" />}

      {showMenuSheet && selectedRoute && (
        <RouteMenuSheet
          route={selectedRoute}
          onClose={() => setShowMenuSheet(false)}
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
