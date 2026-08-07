/*
  CrownIcon 은 여기 있었는데 프리미엄 페이지 재디자인으로 지웠다 — 유일한 사용처였던
  종전 히어로가 로고 락업(`PremiumHero`)으로 바뀌면서 왕관이 빠졌다. 왕관이 다시 필요하면
  blog/components/icons.tsx 에 같은 이름의 것이 살아 있다(그쪽은 `PremiumUpsellSheet` 가 쓴다).
*/

export function AnimatedCheckIcon() {
  return <svg className="payment-check-icon" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden><path className="payment-check-path" d="M8 18.2 15.2 25 28 11.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
