/** 스피너가 얹히는 바닥. 어디 얹히느냐에 따라 링이 배경에 묻히는지가 갈린다. */
type SpinnerSurface = 'cream' | 'premium';

/**
 * ⚠️ **두 값을 서로 바꿔 쓰면 링이 배경에 묻힌다.** 프리미엄 흐름의 바닥은 맨 위가
 * GREEN-300 이라(`premium/lib/backdrop.ts`) 같은 GREEN-300 링이 그대로 사라진다 —
 * 그 파일이 **"초록 테두리는 GREEN-500 이상으로 내린다"** 고 못박아 둔 자리다.
 *
 * 이슈 #250 이 센 "색 하나가 어긋났다"(`PremiumPage` 의 `border-t-pictree-700`)는 사실
 * 그 규칙을 **절반만** 적용한 흔적이었다 — 도는 호만 올리고 링은 300 에 두고 있었다.
 * 여기서 둘을 함께 내려 의도를 마저 채운다.
 */
const SURFACE_CLASS: Record<SpinnerSurface, string> = {
  /** 크림 바닥 위 — 화면 대부분. */
  cream: 'border-pictree-300 border-t-pictree-500',
  /** 프리미엄 그라데이션 위 — `PremiumPage`. 링·호를 한 단계씩 내린다. */
  premium: 'border-pictree-500 border-t-pictree-700',
};

interface SpinnerProps {
  /**
   * 무엇을 기다리는지.
   *
   * **필수다.** 이름 없는 스피너를 아예 못 만들게 해서, 낭독기에 로딩 사실이 하나도
   * 안 가던 5곳(#250 실측)이 다시 생기지 않게 한다. 눈에 안 띄울 거면 값을 빼는 게
   * 아니라 `labelHidden` 을 준다 — 낭독기는 그래도 읽는다.
   */
  label: string;
  /**
   * 문구를 화면에는 안 띄운다(`sr-only`). 자리를 안 차지하므로 `gap-3` 도 안 벌어진다.
   *
   * 잠깐 스치는 확인 화면이거나 문구가 내부 용어일 때 쓴다.
   */
  labelHidden?: boolean;
  surface?: SpinnerSurface;
  /** 세로 스택만 여기서 만든다 — **자리 잡기(가운데 정렬·높이)는 부르는 쪽 책임**이다. */
  className?: string;
}

/**
 * 모양을 모르는 것을 기다리는 동안 도는 원.
 *
 * 화면마다 `size-8 … rounded-full border-[3px] …` 를 복사해 쓰던 7곳을 모았다(이슈 #250).
 * 모으기 전에 이미 **스피너 색이 한 곳**(`PremiumPage`), **문구 스타일이 한 곳**
 * (`DayTreeList` 의 `text-ink-muted`) 갈라져 있었다 — 값이 같아도 리터럴은 규칙을 검사할
 * 수 없게 만든다는, 색 토큰·`Skeleton` 때와 같은 얘기다(CLAUDE.md 「색상」·「로딩 자리」).
 *
 * ⚠️ **`Skeleton` 과 바꿔 쓰는 것이 아니다.** 골격은 "올 것이 **이 자리에 이렇게** 생겼다",
 * 스피너는 "**모양을 모른다**" 다. 자리를 아는 화면을 스피너로 접으면 #239·#240 이 없앤
 * 레이아웃 점프가 그대로 돌아온다. 거꾸로 개수·크기를 서버가 정하는 곳(요금제 카드)에
 * 골격을 쓰면 개수가 곧 주장이 된다 — 그래서 `PremiumPage` 는 일부러 이쪽이다.
 *
 * 낭독기에는 **감싸는 이 요소가 `role="status"` 로 한 번만** 알린다. 도는 원은
 * `aria-hidden` 이다 — `Skeleton` 의 막대와 같은 규칙이다.
 */
export function Spinner({
  label,
  labelHidden = false,
  surface = 'cream',
  className = '',
}: SpinnerProps) {
  return (
    <div role="status" className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        aria-hidden
        className={`size-8 animate-spin rounded-full border-[3px] ${SURFACE_CLASS[surface]}`}
      />
      <p className={labelHidden ? 'sr-only' : 'text-[15px] font-medium text-pictree-700'}>
        {label}
      </p>
    </div>
  );
}
