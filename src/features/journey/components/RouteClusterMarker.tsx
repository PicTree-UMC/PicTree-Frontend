/**
 * 축소했을 때 화면상 가까워진 순번 마커들을 하나로 묶어 보여주는 뱃지(화면설계서 9번).
 * 나무 아이콘 아래에 묶인 개수를 적는다 — 순번은 적지 않는다(여러 개라 붙일 번호가 없다).
 *
 * 홈 지도의 `ClusterMarker` 와 생김새가 같지만 색을 피그마 값으로 직접 쓴다
 * (`pictree-*` 팔레트는 이름만 같고 값이 달라 새 코드에서는 쓰지 않는다 — CLAUDE.md 색상 절).
 */
export function RouteClusterMarker({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center rounded-[12px] border-2 border-[#c5d89d] bg-white px-2 py-1 shadow-md">
      <img src="/markers/tree.svg" alt="" className="h-6 w-6" />
      <span className="text-[13px] font-medium leading-tight text-[#2c3930]">{count}</span>
    </div>
  );
}
