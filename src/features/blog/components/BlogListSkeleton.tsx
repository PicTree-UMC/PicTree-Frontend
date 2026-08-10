import { Skeleton } from '@/shared/components';

/** 카드 한 장이 120px(썸네일 88 + `py-4`)라 첫 화면에 네다섯 장 들어온다. */
const PLACEHOLDER_COUNT = 4;

/** 카드 한 장의 골격. `SavedBlogCard` 와 같은 얼개(썸네일 + 제목 2줄 + 기간 + 나무 수). */
function CardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 py-4">
      <Skeleton className="h-[88px] w-[88px] shrink-0 rounded-xl" />

      <div className="flex min-w-0 flex-1 flex-col self-stretch py-1">
        {/* 제목은 두 줄까지 간다 — 둘째 줄을 짧게 둬야 잘린 문장처럼 읽힌다. */}
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="mt-1.5 h-4 w-3/5 rounded" />
        <Skeleton className="mt-2 h-3 w-24 rounded" />
        {/* 나무 수는 카드 바닥에 붙는다(`mt-auto`). */}
        <Skeleton className="mt-auto h-3 w-16 rounded" />
      </div>
    </div>
  );
}

/**
 * 블로그 목록이 오기 전 자리.
 *
 * ⚠️ **구분선을 그리지 않는다.** 실제 카드에는 아래 선이 있지만, 아직 아무 내용도 없는
 * 줄을 선으로 갈라 두면 "빈 항목이 넷 있다" 처럼 읽힌다. 간격만으로 충분하다.
 *
 * 로딩 중이라는 사실은 여기서 한 번만 알린다(`role="status"`).
 */
export function BlogListSkeleton() {
  return (
    <section
      role="status"
      aria-label="블로그 목록을 불러오는 중"
      className="skeleton-fade-b flex flex-col px-5"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </section>
  );
}
