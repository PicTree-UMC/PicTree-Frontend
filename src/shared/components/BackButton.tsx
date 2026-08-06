import type { ButtonHTMLAttributes } from 'react';

/**
 * 헤더 맨 앞의 뒤로가기.
 *
 * 모으기 전엔 다섯 군데가 전부 달랐다 — 박스가 24·30·32·36·40px 로 갈렸고, 더 눈에 띈 건
 * **실제로 그려지는 꺾쇠**가 9.3×18.7px(프로필) ~ 5.5×11px(블로그) 로 1.7배 차이가 났다는
 * 점이다. 박스만 맞춰서는 안 되고 글리프까지 같이 정해야 크기가 통일돼 보인다.
 *
 * - **박스 40px**(`size-10`) — 가이드라인 §5 의 권장 터치 영역이고, 배경 있는 원형
 *   뒤로가기(지도·카메라)와도 같은 크기라 두 계열의 터치 영역이 맞는다. 종전 프로필의
 *   24px 은 권장치의 절반이었다.
 * - **꺾쇠 12×21, 획 2px** — 프로필이 쓰던 기하다(11곳 중 7곳). iOS 뒤로가기와 같은 비율이라
 *   24px viewBox 짜리(그려지는 건 6×12뿐)보다 이 크기의 버튼에 맞는다.
 * - **색은 INK 고정** — 종전엔 `#303030`(프로필)·`#111`(사진 앨범) 이 섞여 있었다. 둘 다
 *   가이드라인이 INK 로 흡수하라고 적어 둔 사본이다.
 *
 * `-ml-2` 가 박혀 있는 이유: 40px 박스 안에서 12px 꺾쇠는 좌우 14px 씩 여백을 갖는다.
 * 그대로 두면 꺾쇠가 헤더 패딩보다 한참 안쪽으로 들어가 제목과 왼쪽 선이 안 맞는다.
 * 8px 당기면 `px-5` 헤더 기준 꺾쇠 잉크가 화면 끝에서 27px 에 놓이는데, 이는 종전
 * 프로필(24px 박스)과 블로그(`-ml-2` + 36px 박스)가 **이미 둘 다 쓰던 위치**다.
 * 패딩이 다른 헤더(`px-4` 등)에서 어긋나면 `className` 으로 여백만 덮어쓴다.
 *
 * 배경 있는 원형 변형(지도·카메라)은 아직 각 화면이 들고 있다. 바닥에 따라 면·글자를
 * 뒤집어야 해서(가이드라인 §1.2) 여기 톤으로 흡수하려면 그 규칙까지 같이 들어와야 한다.
 */
export function BackButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="뒤로 가기"
      className={`-ml-2 grid size-10 shrink-0 place-items-center text-[#2c3930] ${className}`}
      {...props}
    >
      <svg width="12" height="21" viewBox="0 0 12 21" fill="none" aria-hidden>
        <path
          d="M10.3333 19.6667L1 10.3333L10.3333 1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
