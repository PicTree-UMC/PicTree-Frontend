/** 지도 위 동선 순번 마커. CustomOverlay content 생성 시 renderToStaticMarkup 으로 문자열화해서 사용. */
export function NumberedMarker({ index }: { index: number }) {
  return (
    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#89986d] text-sm font-semibold text-white shadow-md">
      {index}
    </div>
  );
}
