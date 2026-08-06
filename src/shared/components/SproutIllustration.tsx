interface Props {
  className?: string;
  /**
   * `grow` — 흙이 퍼지고 줄기가 그려지고 잎이 펴진다. 한 번만 재생한다(빈 화면용).
   * `breathe` — 다 자란 새싹이 천천히 숨쉰다. 계속 반복한다(로딩용).
   */
  motion?: 'grow' | 'breathe';
}

/**
 * 새싹 일러스트.
 *
 * 타임라인 빈 화면(자라남)과 지도 로딩(숨쉼)이 같은 그림을 쓴다. 패스를 두 벌 두면
 * 한쪽만 고쳐져 서로 달라지므로 여기 하나로 모았다.
 *
 * 색은 잎이 GREEN-500/300, 줄기가 BARK 다 (`docs/design-guidelines.md` — 줄기 갈색은
 * 선·데코 전용). 애니메이션 정의는 `styles.css` 에 있다.
 */
export function SproutIllustration({ className, motion = 'grow' }: Props) {
  const isGrow = motion === 'grow';

  return (
    <svg viewBox="0 0 100 96" className={className} fill="none" aria-hidden>
      <ellipse
        cx="50"
        cy="78"
        rx="30"
        ry="5.5"
        fill="#C5D89D"
        className={isGrow ? 'animate-sprout-soil' : 'animate-sprout-ground'}
      />
      <g className={isGrow ? undefined : 'animate-sprout-breathe'}>
        <path
          d="M50 78 C50 66 50 56 50 40"
          stroke="#7A5C3A"
          strokeWidth="4"
          strokeLinecap="round"
          className={isGrow ? 'animate-sprout-stem' : undefined}
        />
        <path
          d="M50 50c-4-11-14-14-21-13-1 8 4 17 14 18 3 .3 5.5-.6 7-1.6z"
          fill="#788F4A"
          className={isGrow ? 'animate-sprout-leaf-left' : undefined}
        />
        <path
          d="M50 41c4.5-12 15-15 22.5-13.5 1 8.5-4.5 18-15 19-3 .3-6-.6-7.5-1.8z"
          fill="#C5D89D"
          className={isGrow ? 'animate-sprout-leaf-right' : undefined}
        />
      </g>
    </svg>
  );
}
