import { Skeleton } from "@/shared/components";

/**
 * 몇 장을 그릴지.
 *
 * 사진이 4:5 라 390px 폭에서 한 장이 480px 를 넘는다 — 첫 화면에 한 장 반쯤 들어온다.
 * 두 장이면 스크롤 밖까지 덮으므로 더 그릴 이유가 없다.
 */
const PLACEHOLDER_COUNT = 2;

/** 게시물 한 장의 골격. `PhotoPost` 와 같은 얼개로 그린다. */
function PostSkeleton() {
  return (
    <article>
      {/* 머리글 — 나무 아바타 + 장소명 / 날짜. 여백도 `PhotoPost` 와 같은 px-3 pb-2. */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="ml-auto h-4 w-12 rounded" />
      </div>

      {/*
        사진 자리. **각져야 한다** — `PhotoPost` 의 사진도 모서리가 없다.
        `Skeleton` 이 반경을 기본으로 안 갖는 이유가 이 자리다.
      */}
      <Skeleton className="aspect-[4/5] w-full" />

      {/* 액션 줄(하트·수정·삭제) + 한줄평. 캡션은 길이가 제각각이라 한 줄만 잡는다. */}
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="ml-auto h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="mt-2 h-4 w-2/3 rounded" />
      </div>
    </article>
  );
}

/**
 * 타임라인 피드가 오기 전 자리.
 *
 * ⚠️ **텍스트 한 줄("불러오는 중...")을 대신한다.** 그 한 줄에서 전폭 사진 피드로 바뀌면서
 * 이 화면이 앱에서 로딩 점프가 제일 큰 자리였다 — 머리글 아래가 통째로 밀렸다.
 *
 * 로딩 중이라는 사실은 여기서 **한 번만** 알린다(`role="status"`). 안쪽 막대들은
 * 전부 `aria-hidden` 이라 낭독기가 같은 말을 되풀이하지 않는다.
 */
export function TimelineSkeleton() {
  return (
    <div
      role="status"
      aria-label="기록을 불러오는 중"
      className="skeleton-fade-b flex flex-col gap-5 pb-4"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}
