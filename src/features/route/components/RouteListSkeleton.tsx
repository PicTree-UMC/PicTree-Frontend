import { Skeleton } from '@/shared/components';

/**
 * 동선 목록 화면의 로딩 자리.
 *
 * ⚠️ **로드맵은 골격을 그리지 않는다 — 스피너로 둔다.** 다른 화면의 골격은 "카드가
 * 몇 장이든 한 장은 이렇게 생겼다" 를 그리는 것이라 개수를 몰라도 성립하는데,
 * 로드맵은 그렇지 않다:
 *
 *  - 높이가 `TOP + STEP × (장소 수 − 1)` 이라 **장소 수를 모르면 높이가 안 정해진다.**
 *  - 시작과 끝이 있는 **닫힌 도형**이라 아래를 흐려 개수를 얼버무리는 수도 못 쓴다.
 *    목록에서 "이어진다" 는 무해하지만, 동선에서는 **"이 여행에 더 들른 곳이 있다"**
 *    가 된다 — 5곳짜리 동선을 6곳처럼 보이게 만드는 셈이다.
 *
 * 그래서 **모양을 아는 곳은 골격, 모르는 곳은 스피너**로 나눈다. 칩 줄과 메타 줄은
 * 높이가 내용과 무관하게 고정이라 골격이 정확하고, 그 둘만 잡아도 로드맵이 도착할 때
 * 위쪽이 밀리지 않는다 — 화면 점프의 대부분이 거기서 나온다.
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

      {/* 로드맵 자리 — 위 ⚠️ 참고. 모양을 모르니 그리지 않고 기다린다는 표시만 둔다. */}
      <div className="mt-6 flex flex-1 items-center justify-center pb-16">
        <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
      </div>
    </div>
  );
}
