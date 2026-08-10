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
export function RouteListSkeleton() {
  return (
    <div role="status" aria-label="동선을 불러오는 중" className="flex flex-1 flex-col">
      {/*
        칩 줄. 맨 왼쪽 + 버튼은 스크롤 밖에 고정된 실제 요소와 같은 자리이고,
        오른쪽으로 흐려 개수를 주장하지 않는다(`RouteChips` 는 가로 스크롤이다).
      */}
      <div className="flex items-start gap-2 pt-4">
        <Skeleton className="h-10 w-[46px] shrink-0 rounded-full" />
        <div className="skeleton-fade-r flex gap-2 overflow-hidden pb-1">
          <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-24 shrink-0 rounded-full" />
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
