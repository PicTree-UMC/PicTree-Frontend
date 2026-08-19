/**
 * AI 초안 생성권(PICTREE 토큰) 추가 구매 상품 1건.
 *
 * ⚠️ **서버 응답 형태가 아니다.** 아직 상품 API 가 없어서 화면이 필요로 하는 최소한만
 * 우리가 정한 것이다(이슈 #326). 스펙이 나오면 이 타입을 서버 필드명에 맞추고,
 * 필요하면 `api/tokenProductApi` 에서 화면용으로 옮겨 담는다 — 다른 도메인이 그렇게
 * 하고 있다(`routeApi` 의 `toRoute`).
 */
export interface TokenProduct {
  /** 상품 식별자. 결제 주문을 만들 때 서버에 넘길 값이다. */
  id: string;
  /** 이 상품이 주는 생성권 수(회). */
  quantity: number;
  /** 결제 금액(원). 일회성이라 주기가 없다. */
  price: number;
}
