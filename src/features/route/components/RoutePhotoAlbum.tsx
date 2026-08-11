import { useState } from 'react';
import { PhotoStrip, Skeleton, type PhotoPostSlide } from '@/shared/components';
import { useRoutePhotos } from '../hooks/useRoutePhotos';

/**
 * 동선에서 찍은 사진들 — 로드맵·지도 아래에 붙는 앨범 섹션.
 *
 * **한때 메뉴 시트의 `사진 앨범` 줄이었고, 누르면 화면을 거의 덮는 2열 격자 시트가 떴다.**
 * 사진은 이 동선이 어떤 여행이었는지 말해 주는 것 중 가장 강한 것인데, 그걸 보려면 메뉴를
 * 열고 한 번 더 골라야 했다. 목록 화면에 그냥 놓으면 고른 동선을 훑는 흐름
 * (트레이 → 날짜 → 로드맵/지도 → 사진) 안에 자연히 들어온다.
 *
 * 넘기는 방식은 **타임라인 게시물과 같은 것**을 쓴다(`PhotoStrip`) — 스크롤 스냅 한 칸이
 * 사진 한 장이고, 여덟 장까지는 점으로, 그보다 많으면 `n/N` 알약으로 자리를 알려준다.
 * 격자로 늘어놓지 않는 이유는 이 자리가 화면의 일부이기 때문이다: 격자는 세로로 계속
 * 자라서 아래에 무엇을 두든 밀어내지만, 옆으로 미는 한 칸은 장수와 무관하게 높이가 같다.
 *
 * 요청은 새로 나가지 않는다 — 트레이와 로드맵이 이미 같은 캐시 키
 * (`routeKeys.photos(id)`)로 이 사진들을 받아 두었다.
 */
export function RoutePhotoAlbum({ routeId }: { routeId: number }) {
  const { data: photos = [], isLoading, isError, refetch } = useRoutePhotos(routeId);
  const [index, setIndex] = useState(0);

  /*
    보고 있던 장이 목록 밖으로 나가는 경우(사진이 줄어든 재조회) 범위 안으로 당긴다.
    state 를 되돌리지 않는 건 되돌릴 필요가 없어서다 — 다음 렌더도 같은 계산을 한다
    (타임라인 `TimelinePhotoGroup` 과 같은 처리).
  */
  const activeIndex = Math.min(index, Math.max(photos.length - 1, 0));

  if (isLoading) {
    return (
      <section>
        <AlbumHeading />
        <Skeleton className="mt-3 aspect-[4/5] w-full rounded-[16px]" />
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <AlbumHeading />
        <div className="mt-3 flex flex-col items-center gap-3 rounded-[16px] border border-line-soft bg-white py-8">
          <p className="text-[15px] font-medium text-ink">사진을 불러오지 못했어요</p>
          <button
            onClick={() => refetch()}
            className="h-[38px] rounded-[19px] bg-pictree-700 px-6 text-[15px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    /* 사진 없는 동선도 흔하다(장소마다 사진을 올리는 건 아니다). 섹션째 지우지 않고
       한 줄로 남긴다 — 자리가 사라지면 사진을 올리면 여기 붙는다는 것도 같이 사라진다. */
    return (
      <section>
        <AlbumHeading />
        <p className="mt-3 text-[15px] text-ink-muted">이 동선에는 아직 사진이 없어요</p>
      </section>
    );
  }

  const slides: PhotoPostSlide[] = photos.map((photo, order) => ({
    // 같은 나무를 두 번 방문한 동선이 있을 수 있어 treeId 만으로는 키가 겹친다.
    key: `${photo.treeId}-${order}`,
    url: photo.url,
    alt: photo.placeName,
  }));

  return (
    <section>
      <AlbumHeading count={photos.length} />

      {/* 점은 사진 안에 얹는다 — 사진 한 칸이 이 섹션의 전부라, 점이 밖에 있으면 사진과
          다음 섹션 사이에 정체 모를 줄이 하나 끼는 꼴이 된다. */}
      <div className="mt-3">
        <PhotoStrip
          slides={slides}
          activeIndex={activeIndex}
          onActiveIndexChange={setIndex}
          className="overflow-hidden rounded-[16px]"
          dotsInside
        />
      </div>
    </section>
  );
}

/** 섹션 머리. 장수는 다 받아온 뒤에만 말한다(로딩·에러 중에는 셀 것이 없다). */
function AlbumHeading({ count }: { count?: number }) {
  return (
    <h2 className="text-[15px] font-medium text-ink">
      방문한 장소 사진
      {count !== undefined && <span className="ml-2 text-pictree-700">{count}</span>}
    </h2>
  );
}
