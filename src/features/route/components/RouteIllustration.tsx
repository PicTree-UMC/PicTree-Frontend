/**
 * 동선이 만들어지는 순서대로 살아나는 일러스트.
 *
 * 출발점이 콕 찍히고 → 점선 경로가 발자국처럼 이어지고 → 중간 핀이 떨어지고 →
 * 도착 나무가 자란다(약 1.3초). "장소를 이어 동선을 만든다"를 그림이 재연한다.
 *
 * **두 화면이 나눠 쓴다.** 동선이 하나도 없는 빈 화면(`RouteListPage`)에서는 앞으로
 * 만들 것을 보여주고, 저장 직후(`RouteSavedPage`)에서는 방금 만든 것을 되짚는다 —
 * 같은 그림이 앞에서는 예고, 뒤에서는 확인이 된다.
 *
 * 점선은 stroke-dashoffset 을 직접 감지 않는다 — 점선에 offset 을 걸면 점들이
 * 기어가는 것처럼 보인다. 대신 같은 경로의 굵은 선을 mask 로 감아 **드러낸다**.
 *
 * ⚠️ mask 의 `id` 는 문서 전역이다. 한 화면에 둘을 띄울 일이 생기면 `useId` 로 갈라야 한다
 * — 지금은 두 화면이 서로 배타적이라 상수로 둔다.
 */
export function RouteIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={className} fill="none" aria-hidden>
      <defs>
        <mask id="route-illustration-reveal">
          <path
            className="animate-route-path"
            d="M34 118 Q 68 116 92 94 T 168 60"
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        </mask>
      </defs>
      {/* 출발 지점 */}
      <circle
        className="animate-route-dot"
        cx="34"
        cy="118"
        r="6.5"
        fill="#fffcef"
        stroke="#788f4a"
        strokeWidth="3"
      />
      {/* 점선 동선 경로: mask 가 감기며 출발점부터 차례로 드러난다 */}
      <g mask="url(#route-illustration-reveal)">
        <path
          d="M34 118 Q 68 116 92 94 T 168 60"
          stroke="#c5d89d"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 12"
        />
      </g>
      {/* 중간 장소 핀 (뾰족한 끝이 경로 위에 놓인다) — 위에서 떨어진다 */}
      <g className="animate-route-pin">
        <path
          d="M92 54a15 15 0 0 0-15 15c0 10.5 15 25 15 25s15-14.5 15-25a15 15 0 0 0-15-15z"
          fill="#788f4a"
        />
        <circle cx="92" cy="69" r="6" fill="#fffcef" />
      </g>
      {/* 도착: 나무 — 밑동에서 자란다 */}
      <g className="animate-route-tree">
        <rect x="165" y="48" width="6" height="16" rx="3" fill="#788f4a" />
        <circle cx="168" cy="40" r="14" fill="#c5d89d" />
        <circle cx="168" cy="40" r="7" fill="#788f4a" opacity="0.3" />
      </g>
    </svg>
  );
}
