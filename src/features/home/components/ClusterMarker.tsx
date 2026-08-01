/**
 * 줌 아웃 시 가까이 붙은 나무 마커들을 하나로 합쳐 보여주는 클러스터 마커.
 * 지도 위에서 눈에 띄도록 초록 원형 뱃지 안에 나무 아이콘과 묶인 개수를 함께 표시한다.
 */
export function ClusterMarker({ count }: { count: number }) {
  return (
    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-pictree-700 text-white shadow-md ring-2 ring-white">
      <img src="/markers/tree.svg" alt="" className="h-4 w-4 brightness-0 invert" />
      <span className="text-[15px] font-medium leading-none">{count}</span>
    </div>
  );
}
