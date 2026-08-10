import { Skeleton } from '@/shared/components';

/**
 * 블로그 상세가 오기 전 자리.
 *
 * ⚠️ **흰 면(`bg-white`)을 함께 잡는다.** 본문 카드가 화면(크림) 위에 얹히는 흰 판이라,
 * 골격만 그리고 판을 안 깔면 크림 → 흰색으로 바닥색이 통째로 갈아엎어진다. 자리보다
 * 눈에 더 띄는 변화라 여기서는 판이 골격의 절반이다.
 *
 * ⚠️ 그래서 막대도 `surface="card"` 다 — 크림용 `cream-sub` 를 흰 판에 얹으면 누렇게
 * 뜬다. `Skeleton` 이 바탕을 prop 으로 받는 이유가 이 자리다.
 *
 * 본문은 한 편에 여러 날 × 여러 장소라 길이를 모른다. 첫 장소 하나만 그리고 아래를
 * 흐려 "이어진다" 만 말한다 — 몇 편인지는 주장하지 않는다.
 */
export function BlogDetailSkeleton() {
  return (
    <article
      role="status"
      aria-label="블로그를 불러오는 중"
      className="skeleton-fade-b mx-auto w-full max-w-[680px] bg-white px-5 pb-16 pt-8"
    >
      {/* 머리글 — '여행 기록' 라벨 · 제목 두 줄 · 기간 · 작성일 */}
      <header className="border-b border-[#eeeeea] pb-6">
        <Skeleton surface="card" className="h-4 w-16 rounded" />
        <Skeleton surface="card" className="mt-2 h-9 w-full rounded" />
        <Skeleton surface="card" className="mt-1.5 h-9 w-3/5 rounded" />
        <Skeleton surface="card" className="mt-4 h-4 w-40 rounded" />
        <Skeleton surface="card" className="mt-1 h-3 w-28 rounded" />
      </header>

      <div className="pt-8">
        {/* 날짜 머리글은 가운데 정렬이다 */}
        <Skeleton surface="card" className="mx-auto h-6 w-44 rounded" />

        <div className="mt-8">
          {/* 사진 — 실제 사진은 비율이 제각각이라(`max-h-[560px]`) 흔한 4:3 으로 잡는다 */}
          <Skeleton surface="card" className="aspect-[4/3] w-full" />
          <Skeleton surface="card" className="mt-5 h-7 w-2/5 rounded" />
          <Skeleton surface="card" className="mt-3 h-5 w-full rounded" />
          <Skeleton surface="card" className="mt-2 h-5 w-full rounded" />
          <Skeleton surface="card" className="mt-2 h-5 w-4/5 rounded" />
        </div>
      </div>
    </article>
  );
}
