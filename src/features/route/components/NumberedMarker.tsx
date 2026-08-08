/**
 * 지도 위 동선 순번 마커. CustomOverlay content 생성 시 renderToStaticMarkup 으로 문자열화해서 사용.
 *
 * `index` 가 `null` 이면 사용자가 꺼둔 장소다(화면설계서 7번). 지도에서 완전히 지우지 않고
 * 빈 원으로 남기는 게 시안이다 — 자리는 그대로 보여주되 번호 순서에서만 빠진다.
 *
 * **클러스터 마커(48px)보다 한 단 작은 36px 이다.** 묶음은 단일들의 합이라 더 크게 보이는 게
 * 맞고, 색(연초록 vs 짙은 초록)에 크기까지 얹으면 신호가 둘이라 지도를 축소해도 안 무너진다.
 * 색조 차이는 작아질수록 먼저 뭉개지지만 밝기·크기 차는 끝까지 남는다.
 *
 * 채움이 GREEN-300 이라 숫자를 INK 로 얹어 7.9:1 이 나온다 → 크기를 대비가 아니라 **보기 좋은
 * 값**으로 고를 수 있다(GREEN-500 채움일 때는 흰 글자 3.6:1 이라 대형 텍스트 기준을 맞추려고
 * 24px 아래로 못 내려갔다). 36px 는 링 2px 을 빼면 안쪽 32px — 두 자리 숫자(15px 로 약 17px)도
 * 여유가 남는다. 여기서 더 줄이면 숫자가 링에 닿기 시작한다.
 *
 * ⚠️ **`useRoutePath` 의 `CLUSTER_DISTANCE_PX` 가 이 지름과 같은 값이어야 한다** — 규칙이
 * '원이 겹치기 시작하면 묶는다' 라서다. 크기를 바꿀 때 둘을 같이 옮길 것.
 */
export function NumberedMarker({ index }: { index: number | null }) {
  if (index === null) {
    // 꺼둔 장소. 테두리를 INK-비활성 회색으로 둔다 — 연초록 테두리는 켜진 마커의 채움색과
    // 이웃해서 '흐린 초록 = 꺼짐'이 잘 안 읽혔다. 회색이면 색만 보고 바로 갈린다.
    return <div className="h-9 w-9 rounded-full border-2 border-[#b4b4b4] bg-white shadow-md" />;
  }

  return (
    // 테두리가 흰색이 아니라 GREEN-700 인 건 클러스터 채움색과 같은 값이기 때문이다 —
    // '연초록 알맹이 + 짙은 테두리 = 하나', '짙은 초록 덩어리 = 여럿' 으로 둘이 한 체계로 읽힌다.
    // 채움이 밝아진 뒤로는 흰 링이 밝은 지도 위에서 경계를 잡아주지도 못했다.
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pictree-300 text-[15px] font-medium leading-none text-[#2c3930] shadow-md ring-2 ring-pictree-700">
      {index}
    </div>
  );
}
