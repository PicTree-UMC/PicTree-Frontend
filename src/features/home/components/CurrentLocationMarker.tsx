/**
 * 지도에 표시되는 "현재 내 위치" 점.
 * 파란 점 + 반투명 정확도 링(맥동)으로 표준 지도 앱의 위치 표시를 흉내 낸다.
 */
export function CurrentLocationMarker() {
  return (
    <div className="relative flex h-5 w-5 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
      <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-md" />
    </div>
  );
}
