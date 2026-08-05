/**
 * 줌 아웃 시 가까이 붙은 마커들을 하나로 합쳐 보여주는 클러스터 마커.
 * 지도 위에서 눈에 띄도록 초록 원형 뱃지 안에 나무 아이콘과 묶인 개수를 함께 표시한다.
 *
 * **홈 지도와 동선 지도가 같은 것을 쓴다.** 동선 쪽에는 흰 사각 뱃지(`RouteClusterMarker`)가
 * 따로 있었는데, 같은 화면에서 하는 일이 같은데 생김새만 다를 이유가 없어 이쪽으로 합쳤다.
 *
 * 초록은 `pictree-700`(= GREEN-700 #5B6B38). 흰 숫자와 5.8:1 이라 본문 기준을 넘는다.
 */
export function ClusterMarker({ count }: { count: number }) {
  return (
    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-pictree-700 text-white shadow-md ring-2 ring-white">
      <img src="/markers/tree.svg" alt="" className="h-4 w-4 brightness-0 invert" />
      <span className="text-[15px] font-medium leading-none">{count}</span>
    </div>
  );
}
