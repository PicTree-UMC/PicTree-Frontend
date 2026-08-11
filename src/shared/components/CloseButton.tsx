import type { ButtonHTMLAttributes } from 'react';

/**
 * 헤더 맨 앞의 닫기(×) — **`BackButton` 의 자리를 대신 차지하는 물건**이다.
 *
 * 뒤로가기가 "왔던 곳으로" 라면 이건 "이 화면을 접는다" 다. 편집 화면이나 선택 모드처럼
 * 되돌아갈 이력이 아니라 **지금 벌여 둔 상태**를 닫는 자리에 쓴다.
 *
 * 기하는 `BackButton` 과 **완전히 같다** — 40px 흰 원(§5 권장 터치 영역) + 옅은 그림자,
 * 24 viewBox 를 24px 로 그린 글리프, 획 2.25, 색 INK, 바깥 여백 없음. 두 버튼이 같은
 * 헤더 첫 칸을 번갈아 차지하므로(선택 모드 진입 등) **폭이 1px 이라도 다르면 모드가
 * 바뀔 때 헤더가 흔들린다.** `NavBar` 의 `leading` 이 "40px 짜리를 넣을 것" 이라고
 * 못박아 둔 것이 이 자리다.
 *
 * ⚠️ **어두운 바닥에는 쓰지 않는다**(§1.2). 사진·지도 위에서는 흰 원이 화면에서 제일 밝은
 * 덩어리가 돼 피사체보다 먼저 읽힌다 — 그쪽은 면 없는 × 를 따로 그린다(`MarkerStoryViewer`·
 * `CameraPage`). 그래서 이 컴포넌트가 앱의 모든 × 를 흡수하지는 않는다.
 */
export function CloseButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="닫기"
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink shadow-[0_2px_6px_rgba(0,0,0,0.15)] ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
