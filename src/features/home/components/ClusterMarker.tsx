/**
 * 줌 아웃 시 가까이 붙은 나무 마커들을 하나로 합쳐 보여주는 클러스터 뱃지.
 * 나무 아이콘 아래 묶인 개수를 표시한다.
 */
export function ClusterMarker({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-pictree-500 bg-white px-2 py-1 shadow-sm">
      <img src="/markers/tree.svg" alt="" className="h-6 w-6" />
      <span className="text-xs font-bold text-pictree-700">{count}</span>
    </div>
  );
}
