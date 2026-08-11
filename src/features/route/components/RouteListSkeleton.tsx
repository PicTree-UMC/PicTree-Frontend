import { Skeleton } from '@/shared/components';

import { RouteRoadmapLoader } from './RouteRoadmapLoader';

/**
 * 동선 목록 화면의 로딩 자리.
 *
 * **자리마다 방식이 다르다.** 칩 줄과 메타 줄은 높이가 내용과 무관하게 고정이라 막대
 * 골격이 정확하고, 그 둘만 잡아도 데이터가 올 때 위쪽이 안 밀린다 — 화면 점프의 대부분이
 * 거기서 나온다.
 *
 * 로드맵은 막대로 못 그린다. 시작과 끝이 있는 **닫힌 도형**이라 아래를 흐려 개수를
 * 얼버무리는 수(`skeleton-fade-b`)를 못 쓴다 — 목록에서 "이어진다" 는 무해하지만
 * 동선에서는 **"이 여행에 더 들른 곳이 있다"** 가 된다. 대신 **경로가 깔리는 연출**로
 * 간다(`RouteRoadmapLoader`): 계속 그려지는 중이면 개수가 주장이 되지 않는다.
 *
 * ⚠️ 로드맵 높이가 실제와 달라도 괜찮다 — **페이지의 마지막 요소라 뒤에 밀릴 것이 없다.**
 * 스크롤 길이만 달라진다. 목록 골격에서 개수가 문제였던 건 아래에 내용이 이어졌기 때문이다.
 */
/**
 * 트레이 한 칸의 골격 — 원 + 이름 자리.
 *
 * 크기는 `RouteTray` 의 것과 같은 값이다(링 상자 66 / 칸 폭 72 / 원 56). 링은 회색 막대
 * 하나로 흡수한다 — 로딩 중에는 고른 것이 없어 링 색이 말할 상태가 없다.
 */
function TrayItemSkeleton() {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-2">
      <div className="flex size-[66px] items-center justify-center">
        <Skeleton className="size-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-12 rounded" />
    </div>
  );
}

export function RouteListSkeleton() {
  return (
    <div role="status" aria-label="동선을 불러오는 중" className="flex flex-1 flex-col">
      {/*
        동선 트레이. 맨 왼쪽 `새 동선` 칸은 스크롤 밖에 고정된 실제 요소와 같은 자리이고,
        오른쪽으로 흐려 개수를 주장하지 않는다(`RouteTray` 는 가로 스크롤이다).

        원 아래 이름은 길이가 제각각이라 골격에서는 짧은 막대로 통일한다 — 실제 이름 길이를
        흉내 내면 데이터가 올 때 길이가 늘었다 줄었다 하는 것처럼 보인다.
      */}
      <div className="-mx-5 flex items-start gap-2 pl-5 pt-4">
        <TrayItemSkeleton />
        <div className="skeleton-fade-r flex gap-2 overflow-hidden">
          <TrayItemSkeleton />
          <TrayItemSkeleton />
          <TrayItemSkeleton />
          <TrayItemSkeleton />
        </div>
      </div>

      {/* 메타 줄 — 날짜 + 장소 수 / 더보기 · 삭제 버튼. 높이가 고정이라 그대로 잡는다. */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <div>
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="mt-1 h-3 w-16 rounded" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      {/* 로드맵 자리 — 위 ⚠️ 참고. 경로가 깔리는 연출로 대신한다. */}
      <div className="mt-6">
        <RouteRoadmapLoader />
      </div>
    </div>
  );
}
