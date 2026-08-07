import type { BillingKeyDto } from '../types/payment';

/**
 * 실제로 청구에 쓸 수 있는 카드인가.
 *
 * `status` 는 'ACTIVE' 만 확인됐고 나머지 값은 미확인이다(types/payment.ts). 그래서
 * **'ACTIVE 가 아니면 못 쓴다'** 로 좁게 잡는다 — 모르는 상태를 쓸 수 있다고 넘겼다가
 * 결제가 실패하면, 사용자는 방금 고른 카드가 왜 안 됐는지 알 방법이 없다.
 */
export const isActiveCard = (card: BillingKeyDto) => card.status === 'ACTIVE';

/**
 * 재사용할 카드 한 장. 없으면 `undefined`.
 *
 * 여러 장이면 첫 ACTIVE 를 고른다. 서버가 '기본 카드' 를 표시해 주지 않아서 고를 근거가
 * 목록 순서뿐이다 — 결제 확인 시트가 어느 카드인지 마스킹 번호로 보여주고, 아니면
 * '다른 카드로 결제' 로 빠질 수 있게 해서 이 짐작이 막다른 길이 되지 않게 한다.
 */
export const findActiveCard = (cards: BillingKeyDto[] | undefined) =>
  cards?.find(isActiveCard);
