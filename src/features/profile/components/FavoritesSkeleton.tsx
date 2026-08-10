import { Skeleton } from "@/shared/components";

/**
 * 몇 칸을 그릴지. 3열 격자에 타일이 `aspect-[3/4]` 라 390px 폭에서 한 줄이 약 173px —
 * 첫 화면에 세 줄이 들어온다. 딱 그만큼만 그린다.
 */
const PLACEHOLDER_COUNT = 9;

/**
 * 즐겨찾기 격자가 오기 전 자리. `FavoriteGrid` 와 같은 3열 · `gap-0.5` · `aspect-[3/4]`.
 *
 * 타일은 **각져야 한다** — 격자가 화면 끝까지 맞붙는 모양이라 실제 타일에도 반경이 없다.
 *
 * 로딩 중이라는 사실은 여기서 한 번만 알린다(`role="status"`) — 안쪽 막대는 전부
 * `aria-hidden` 이다.
 */
export function FavoritesSkeleton() {
  return (
    <div role="status" aria-label="즐겨찾기를 불러오는 중" className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4] w-full" />
      ))}
    </div>
  );
}
