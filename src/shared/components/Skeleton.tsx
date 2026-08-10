/** 바탕이 되는 면. 어디 얹히느냐에 따라 보이는 회색이 달라진다. */
type SkeletonSurface = 'cream' | 'card';

/**
 * ⚠️ **두 값을 서로 바꿔 쓰면 막대가 안 보인다.** 크림 바닥(`bg-cream`) 위에서
 * `line-soft` 는 너무 옅고, 흰 카드 위에서 `cream-sub` 는 배경과 붙는다.
 */
const SURFACE_CLASS: Record<SkeletonSurface, string> = {
  /** 크림 바닥 위 — 페이지 본문 대부분. */
  cream: 'bg-cream-sub',
  /** 흰 카드 안 — `SettingsList` · `ProfileSummary` 의 타일 같은 자리. */
  card: 'bg-line-soft',
};

interface SkeletonProps {
  /**
   * 크기·모양. **모서리 반경도 여기서 준다** — 아래 ⚠️ 참고.
   * 자리를 그대로 잡는 것이 목적이라 실제 요소와 같은 높이를 넘기는 게 좋다.
   */
  className?: string;
  surface?: SkeletonSurface;
}

/**
 * 값을 기다리는 동안 자리를 잡아 두는 막대.
 *
 * 화면마다 `animate-pulse rounded bg-…` 를 따로 적던 것을 모았다. 모으기 전에 이미
 * 바탕색이 두 갈래(`cream-sub` / `line-soft`)로 갈려 있었고, 왜 갈랐는지는 한 곳에만
 * 주석으로 남아 있었다 — 값이 같아도 리터럴은 규칙을 검사할 수 없게 만든다는,
 * 색 토큰 때와 같은 얘기다(CLAUDE.md 「색상」).
 *
 * ⚠️ **모서리 반경을 기본값으로 두지 않는다.** `rounded` 를 여기 박으면 사진 자리처럼
 * **각져야 하는 골격이 그걸 못 지운다** — Tailwind 는 border-radius 를 값 오름차순으로
 * 내보내서 `rounded-none` 이 `rounded` **앞**에 오고, 뒤에 오는 `rounded` 가 이긴다.
 * 부르는 쪽이 항상 정한다.
 *
 * 낭독기에는 안 읽힌다 — 로딩 중이라는 사실은 이 막대들을 감싸는 쪽이 `role="status"`
 * 로 **한 번만** 알린다. 막대마다 읽히면 같은 말을 열 번 한다.
 */
export function Skeleton({ className = '', surface = 'cream' }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse ${SURFACE_CLASS[surface]} ${className}`}
    />
  );
}
