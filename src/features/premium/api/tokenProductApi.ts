import type { TokenProduct } from '../types/tokenProduct';

/**
 * AI 초안 생성권(PICTREE 토큰) 추가 구매 상품 API 레이어.
 *
 * ⚠️⚠️ **여기는 아직 목데이터다.** 2026-08-04 스웨거 기준으로 서버에 상품 목록 API 가
 * 없다. 화면·로딩·에러를 먼저 만들어 두고 스펙이 나오면 **이 파일의 함수 본문만** 갈아
 * 끼우는 것이 목적이라, 값은 반드시 `api/` 뒤에 둔다 — 컴포넌트가 수량·금액을 직접
 * 알면 그때는 파일 여러 개를 고쳐야 한다(이슈 #326).
 *
 * 서버가 생기면 바뀌는 것:
 *   getTokenProducts()  →  GET /token-products (가칭)
 *   purchaseTokens()    →  일회성 결제 주문 생성. 지금 `POST /payment-orders` 는
 *                          **구독 요금제 전용**이다(없는 코드를 넣으면 404 응답이
 *                          `구독 요금제를 찾을 수 없습니다`).
 *
 * ⚠️ 값을 화면에 하드코딩하지 말 것 — 요금제 값을 상수로 들고 있다가 실제 가격과
 * 어긋났던 전례가 있다(`lib/planDisplay` 맨 위 "되돌리지 말 것").
 */

/**
 * 시안(WF-021)에 적힌 3종.
 *
 * ⚠️ **이 숫자들은 확정 값이 아니다.** 디자인 시안에만 있고 서버·기획 문서에서 확인된
 * 바 없다. 서버 스펙이 나오면 통째로 사라질 값이라 여기 한 곳에만 둔다.
 */
const MOCK_PRODUCTS: TokenProduct[] = [
  { id: 'token-5', quantity: 5, price: 1900 },
  { id: 'token-10', quantity: 10, price: 3500 },
  { id: 'token-30', quantity: 30, price: 8900 },
];

/** 목 응답이 즉시 오면 로딩 상태를 한 번도 못 그려 본 채로 개발하게 된다. */
const MOCK_DELAY_MS = 400;

/**
 * 구매 가능한 생성권 상품 목록. 수량 오름차순.
 *
 * 정렬을 여기서 보장한다 — 화면이 칩을 그리는 순서가 곧 이 배열 순서이고, 서버가
 * 순서를 보장해 줄지 알 수 없다.
 */
export const getTokenProducts = async (): Promise<TokenProduct[]> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return [...MOCK_PRODUCTS].sort((a, b) => a.quantity - b.quantity);
};

/**
 * 서버가 일회성 결제를 받을 준비가 됐는지.
 *
 * ⚠️ **화면이 결제 버튼을 잠그는 근거가 이 값 하나다.** 상수를 컴포넌트에 두면 서버가
 * 생겼을 때 어디를 켜야 하는지 찾아다니게 된다 — `purchaseTokens` 를 구현하면서 이
 * 값을 `true` 로 바꾸면 화면이 따라 열린다.
 *
 * 결제되는 척하는 버튼을 배포하지 않기 위한 장치다. 눌러도 아무 일이 없거나 "준비
 * 중" 토스트만 뜨는 버튼은, 사용자가 결제에 실패했다고 읽는다.
 */
export const IS_TOKEN_PURCHASE_READY = false;

/**
 * 생성권 구매 주문. **아직 구현되지 않았다.**
 *
 * 서버 스펙이 나오기 전에는 호출될 일이 없다(`IS_TOKEN_PURCHASE_READY` 가 막는다).
 * 그래도 함수를 비워 두지 않고 던지게 해 두는 이유는, 실수로 배선이 열렸을 때 조용히
 * 성공한 것처럼 지나가지 않게 하기 위해서다.
 */
export const purchaseTokens = async (productId: string): Promise<never> => {
  throw new Error(
    `생성권 구매 API 가 아직 없습니다 (productId: ${productId}). 서버 스펙이 나오면 tokenProductApi 를 구현할 것.`,
  );
};
