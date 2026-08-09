import { NavBar, Sheet } from '@/shared/components';
import { Route } from '../types/route';
import { useRoutePhotos } from '../hooks/useRoutePhotos';

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
      className="overflow-hidden rounded-t-[20px] bg-[#fffcef] shadow-[0_-4px_6px_0_rgba(0,0,0,0.12)]"
      contentClassName="flex flex-col overflow-hidden"
      bottomPadding="0"
    >
      {/* 헤더: 뒤로 가기 + 동선 이름 + 날짜 */}
      {/* px-[17px] 이었는데 다른 헤더(px-5)와 어긋나 뒤로가기 원만 3px 안쪽에 있었다. */}
      <header className="h-[70px] shrink-0 bg-[#f6f0d7] px-5">
        <NavBar
          className="h-full"
          onBack={onClose}
          title={route.title}
          action={
            <span className="text-[13px] font-medium tracking-[0.12px] text-[#2c3930]">
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
          <div className="mt-[22px] flex justify-center">
            <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
          </div>
        ) : isError ? (
          <div className="mt-[22px] flex flex-col items-center gap-4">
            <p className="text-[15px] font-medium text-[#2c3930]">사진을 불러오지 못했어요</p>
            <button
              onClick={() => refetch()}
              className="h-[38px] rounded-[19px] bg-pictree-700 px-6 text-[15px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : photos.length === 0 ? (
          <p className="mt-[22px] text-[15px] font-medium text-[#2c3930]">
            이 동선에는 아직 사진이 없어요
          </p>
        ) : (
          <ul className="mt-[22px] grid grid-cols-2 gap-5">
            {photos.map((photo) => (
              <li key={photo.treeId} className="aspect-square overflow-hidden bg-[#d9d9d9]">
                {/*
                    사진 없는 장소는 앱 아이콘으로 대체한다(백엔드가 url=null 로 내려주는 자리).
                    아이콘 이미지에 둥근 모서리가 그려져 있어 scale 로 살짝 키워 잘라낸다 —
                    타임라인 썸네일과 같은 처리(TimelineCard).
                  */}
                <img
                  src={photo.url ?? '/apple-touch-icon.jpg'}
                  alt={photo.placeName}
                  className={`size-full object-cover ${photo.url ? '' : 'scale-[1.12]'}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
