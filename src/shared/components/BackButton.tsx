import type { ButtonHTMLAttributes } from 'react';

/**
 * 헤더 맨 앞의 뒤로가기.
 *
 * 모으기 전엔 다섯 군데가 전부 달랐다 — 박스가 24·30·32·36·40px 로 갈렸고, 더 눈에 띈 건
 * **실제로 그려지는 꺾쇠**가 9.3×18.7px(프로필) ~ 5.5×11px(블로그) 로 1.7배 차이가 났다는
 * 점이다. 박스만 맞춰서는 안 되고 글리프까지 같이 정해야 크기가 통일돼 보인다.
 *
 * - **박스 40px**(`size-10`) — 가이드라인 §5 의 권장 터치 영역이다. 종전 프로필의 24px 은
 *   권장치의 절반이었다.
 * - **꺾쇠 6×12, 획 2.25px** — 동선 생성 스텝 2(`RouteViewPage`)의 원형 뒤로가기와 같은
 *   기하다(24 viewBox 를 24px 로). 한때 프로필이 쓰던 12×21 을 기준으로 잡았는데, 그건 면이
 *   없던 시절 얘기다 — 40px 원 안에 넣으면 원을 거의 채워 버린다. 면이 생기면 글리프는
 *   작아져야 원과 꺾쇠의 비율이 맞는다.
 * - **색은 INK 고정** — 종전엔 `#303030`(프로필)·`#111`(사진 앨범) 이 섞여 있었다. 둘 다
 *   가이드라인이 INK 로 흡수하라고 적어 둔 사본이다.
 *
 * - **면은 항상 있다** — 흰 원(§1.1 '떠 있는 면')에 옅은 그림자. 예전엔 지도·카메라처럼
 *   콘텐츠 위에 뜬 화면에만 원을 줬는데, 그러면 같은 버튼이 화면마다 다르게 생긴다. 흰 원은
 *   세 바닥(프로필 초록 밴드·크림 페이지·사진 앨범 베이지) 모두에 얹힌다 — 초록 위에선
 *   또렷하고, 크림 위에선 그림자 덕에 은은하게 뜬다.
 *
 * ⚠️ 사진·지도처럼 **어두운 바닥 위에서는 흰 원을 쓰지 않는다**(§1.2). 화면에서 제일 밝은
 * 덩어리가 돼 피사체보다 먼저 읽힌다 — 그쪽은 INK 면 + 크림 글자로 뒤집는다(참고 `CameraPage`).
 *
 * 바깥 여백은 안 갖는다. 원의 왼쪽 끝이 헤더 패딩(`px-5`)에 그대로 맞아 아래 본문과 선이 선다.
 * 면이 생기면서 종전의 `-ml-2` 당김은 필요 없어졌다 — 맞출 대상이 꺾쇠 잉크에서 원 테두리로
 * 바뀌었기 때문이다.
 */
export function BackButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="뒤로 가기"
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-[0_2px_6px_rgba(0,0,0,0.15)] ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
