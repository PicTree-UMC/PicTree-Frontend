import { NavBar, Photo, Sheet, Skeleton } from '@/shared/components';
import { Route } from '../types/route';
import { useRoutePhotos } from '../hooks/useRoutePhotos';

/**
 * 앨범 격자가 오기 전 자리. 본문 격자와 같은 2열 · `gap-5` · 정사각.
 *
 * 시트가 화면 거의 전부를 덮으므로 세 줄이면 첫 화면이 찬다. 아래를 흐려 몇 장인지는
 * 주장하지 않는다 — 사진이 두 장뿐인 동선도 흔하다.
 */
function AlbumSkeleton() {
  return (
    <ul
      role="status"
      aria-label="사진을 불러오는 중"
      className="skeleton-fade-b mt-[22px] grid grid-cols-2 gap-5"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <Skeleton className="aspect-square w-full" />
        </li>
      ))}
    </ul>
  );
}

interface PhotoAlbumSheetProps {
  route: Route;
  onClose: () => void;
}

/**
 * 동선의 사진 앨범. 동선 목록 위에 딤과 함께 덮이는 전체 높이 시트.
 * 상단 80px는 뒤 화면이 비치도록 비워 둔다(시안 기준).
 */
export function PhotoAlbumSheet({ route, onClose }: PhotoAlbumSheetProps) {
  const { data: photos = [], isLoading, isError, refetch } = useRoutePhotos(route.id);

  return (
    /*
      전체 높이 시트라 손잡이가 없다 — 헤더의 뒤로 가기가 닫기 역할을 한다.
      아래 여백은 안쪽 스크롤 영역이 갖고 있어 셸의 safe-area 여백은 끈다.
    */
    <Sheet
      onClose={onClose}
      label={`${route.title} 사진 앨범`}
      dim="dark"
      handle={false}
      top="5rem"
      className="overflow-hidden rounded-t-[20px] bg-cream shadow-[0_-4px_6px_0_rgba(0,0,0,0.12)]"
      contentClassName="flex flex-col overflow-hidden"
      bottomPadding="0"
    >
      {/* 헤더: 뒤로 가기 + 동선 이름 + 날짜 */}
      {/* px-[17px] 이었는데 다른 헤더(px-5)와 어긋나 뒤로가기 원만 3px 안쪽에 있었다. */}
      <header className="h-[70px] shrink-0 bg-cream-sub px-5">
        <NavBar
          className="h-full"
          onBack={onClose}
          title={route.title}
          action={
            <span className="text-[13px] font-medium tracking-[0.12px] text-ink">
              {route.date}
            </span>
          }
        />
      </header>

      {/* 본문: 사진 개수 + 2열 그리드. 로딩·에러 중에는 개수를 숨긴다(목록 화면과 같은 규칙). */}
      {/* 안쪽 스크롤 영역이 아래 여백을 갖는다 — 홈 인디케이터를 피하려면 여기여야 한다. */}
      <div className="flex-1 overflow-y-auto px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[22px]">
        <p className="text-base font-semibold tracking-[0.16px] text-black">
          방문한 장소 사진
          {!isLoading && !isError && <span className="ml-2 text-pictree-700">{photos.length}</span>}
        </p>

        {isLoading ? (
          <AlbumSkeleton />
        ) : isError ? (
          <div className="mt-[22px] flex flex-col items-center gap-4">
            <p className="text-[15px] font-medium text-ink">사진을 불러오지 못했어요</p>
            <button
              onClick={() => refetch()}
              className="h-[38px] rounded-[19px] bg-pictree-700 px-6 text-[15px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : photos.length === 0 ? (
          <p className="mt-[22px] text-[15px] font-medium text-ink">
            이 동선에는 아직 사진이 없어요
          </p>
        ) : (
          <ul className="mt-[22px] grid grid-cols-2 gap-5">
            {photos.map((photo) => (
              <li key={photo.treeId} className="aspect-square overflow-hidden bg-line">
                {/*
                    사진이 없거나(url=null) 못 불러오면 나무 폴백으로 떨어진다.
                    예전엔 앱 아이콘을 깔았는데, 아이콘에 둥근 모서리가 그려져 있어
                    `scale-[1.12]` 로 잘라내는 땜질이 딸려 있었다 — 폴백을 바꾸면서 함께 없앴다.
                  */}
                <Photo
                  src={photo.url}
                  alt={photo.placeName}
                  className="size-full object-cover"
                  iconClassName="h-10 w-10"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
