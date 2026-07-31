/**
 * 프리미엄 화면의 로컬 UI 상태 타입만 남는다.
 *
 * 요금제 자체(이름·가격·용량·횟수)는 GET /subscription-plans 가 진실이다.
 * 여기 있던 PLAN_DETAILS 상수와 'plus'|'pro'|'max' 유니온은 제거했다 —
 * 서버 가격과 어긋난 채(플러스 4,900원 vs 실제 2,900원) 굳어 있었고,
 * 요금제가 늘면 화면 코드를 같이 고쳐야 했다. 표시 문구는 lib/planDisplay.ts 참조.
 */
export type PaymentStep = 'plan' | 'confirm' | 'complete';
