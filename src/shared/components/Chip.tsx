import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

/**
 * 칩이 놓인 **바닥에 따라** 고른다. 셋 다 같은 기하(높이·모서리·글자)를 쓰고 색만 다르다.
 *
 * - `outline` — 크림·흰 배경 위의 주 선택기. 안 고른 것도 흰 알약으로 남아 줄이 눈에 띈다.
 * - `ghost` — 배경 없는 맨 글자. 화면의 주인공이 아닌 보조 전환(정렬 같은)용.
 * - `cream` — 지도·초록 패널 위. 반대로 크림이 칩 쪽에 오고 바닥이 짙다.
 */
export type ChipTone = 'outline' | 'ghost' | 'cream';

/** `md`(40px)가 기본이고 권장 터치 영역이다. `sm`은 화면의 주역이 아닌 보조 전환에만. */
export type ChipSize = 'sm' | 'md';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  /**
   * 고른 상태. **넘기지 않으면 `aria-pressed` 도 안 붙는다** — 누를 때마다 켜졌다 꺼지는
   * 토글이 아니라 한 번 하고 끝나는 동작(예: 고른 날짜를 빼기)에 쓰는 칩이기 때문이다.
   *
   * ⚠️ 라디오 그룹의 하나로 쓸 때는 `role="radio"` 와 `aria-checked` 를 직접 넘길 것.
   * 그 경우 `aria-pressed` 는 붙지 않는다(한 요소에 두 상태를 겹쳐 알리면 낭독이 어긋난다).
   */
  selected?: boolean;
  /** 글자 앞. 아이콘 정도만 — 칩은 한 줄짜리다. */
  leading?: ReactNode;
  /** 글자 뒤. 주로 × 아이콘. */
  trailing?: ReactNode;
  /**
   * 고른 칩을 화면 안으로 끌어오는 쪽(`JourneyChips`)이 위치를 재려고 쓴다.
   * React 19 부터는 함수 컴포넌트도 ref 를 보통 prop 으로 받으므로 forwardRef 가 필요 없다.
   */
  ref?: Ref<HTMLButtonElement>;
}

/*
  대비는 전부 실측값이다(docs/design-guidelines.md 의 팔레트 기준).

  | 톤 | 고름 | 대비 | 안 고름 | 대비 |
  |---|---|---|---|---|
  | outline | GREEN-700 채움 + 흰 글자 | 5.8:1 | 흰 채움 + INK | 13:1 |
  | ghost   | GREEN-300 채움 + INK    | 7.9:1 | 맨 글자 #60655C | 5.9:1 |
  | cream   | 크림/90 + INK           | 높음  | 크림/45 + GREEN-700 | 4.6:1 |

  ⚠️ **고른 칩에 GREEN-500(#788F4A)을 쓰지 않는다** — 흰 글자가 3.6:1 이라 본문 기준
  4.5:1 에 못 미친다. 가이드라인에 '데코 전용 · 텍스트 금지'로 적혀 있는 색이다.
  (`JourneyChips` 가 이 조합을 쓰고 있었고 이 컴포넌트로 옮기면서 풀렸다.)

  ⚠️ **안 고른 칩의 글자를 흐리게 하지 않는다.** 안 골랐어도 여전히 눌러서 고를 수 있는
  버튼이라 읽혀야 한다 — 상태 차이는 채움과 그림자로 낸다. `cream` 의 안 고른 쪽만
  INK 대신 GREEN-700 을 쓰는데, 흐리게 만든 게 아니라 **색을 바꾼 것**이다(4.6:1 유지).
*/
const TONE_CLASS: Record<ChipTone, { on: string; off: string }> = {
  outline: {
    on: 'bg-pictree-700 text-white',
    off: 'border border-pictree-300 bg-white text-[#2c3930]',
  },
  ghost: {
    on: 'bg-pictree-300 text-[#2c3930]',
    off: 'text-[#60655c]',
  },
  cream: {
    on: 'bg-[#fffcef]/90 text-[#2c3930] shadow-[0_2px_6px_rgba(0,0,0,0.15)]',
    off: 'bg-[#fffcef]/45 text-[#5b6b38]',
  },
};

const SIZE_CLASS: Record<ChipSize, string> = {
  sm: 'h-8 gap-1 px-3',
  md: 'h-10 gap-1.5 px-4',
};

/**
 * 가로로 늘어놓고 고르는 알약 버튼.
 *
 * 앱 곳곳에서 저마다 만들어 쓰던 걸 하나로 모은 것이다 — 모으기 전엔 모서리(완전 둥금 vs
 * 10px), 높이(28·34·38·40), 글자(14 bold vs 15 medium), 상태 표시 방법이 네 군데 다 달랐고,
 * 그중 하나는 흰 글자 대비가 기준에 못 미쳤다.
 *
 * **바깥 여백·스크롤은 이 컴포넌트가 안 갖는다.** 칩 줄은 화면마다 다르게 놓인다(가로 스크롤,
 * 줄바꿈, 고정 폭) — 부모가 정하고 칩은 알약 하나만 그린다. `shrink-0` 만 기본으로 붙여
 * 가로 스크롤 줄에서 칩이 찌그러지지 않게 한다.
 */
export function Chip({
  children,
  tone = 'outline',
  size = 'md',
  selected,
  leading,
  trailing,
  className = '',
  role,
  ...props
}: ChipProps) {
  const state = TONE_CLASS[tone][selected ? 'on' : 'off'];

  return (
    <button
      type="button"
      role={role}
      // 토글일 때만 붙인다. 위 `selected` 주석 참고.
      aria-pressed={selected !== undefined && role === undefined ? selected : undefined}
      className={`flex shrink-0 items-center rounded-full text-[15px] font-medium transition-colors ${SIZE_CLASS[size]} ${state} ${className}`}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}
