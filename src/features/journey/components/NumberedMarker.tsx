/**
 * 지도 위 동선 순번 마커. CustomOverlay content 생성 시 renderToStaticMarkup 으로 문자열화해서 사용.
 *
 * `index` 가 `null` 이면 사용자가 꺼둔 장소다(화면설계서 7번). 지도에서 완전히 지우지 않고
 * 빈 원으로 남기는 게 시안이다 — 자리는 그대로 보여주되 번호 순서에서만 빠진다.
 */
export function NumberedMarker({ index }: { index: number | null }) {
  if (index === null) {
    return (
      <div className="h-[30px] w-[30px] rounded-full border-2 border-[#9cab84] bg-white shadow-md" />
    );
  }

  return (
    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#89986d] text-sm font-semibold text-white shadow-md">
      {index}
    </div>
  );
}
