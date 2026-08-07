import type { BillingKeyDto } from '../types/payment';

/**
 * 실제로 청구에 쓸 수 있는 카드인가.
 *
 * `status` 는 'ACTIVE' 만 확인됐고 나머지 값은 미확인이다(types/payment.ts). 그래서
 * **'ACTIVE 가 아니면 못 쓴다'** 로 좁게 잡는다 — 모르는 상태를 쓸 수 있다고 넘겼다가
 * 결제가 실패하면, 사용자는 방금 고른 카드가 왜 안 됐는지 알 방법이 없다.
 */
export const isActiveCard = (card: BillingKeyDto) => card.status === 'ACTIVE';

/*
  findActiveCard('첫 ACTIVE 한 장' 을 골라 주던 함수)는 지웠다. 결제 화면이 쓸 수 있는 카드를
  전부 늘어놓고 고르게 바뀌면서 프론트가 대신 고를 일이 없어졌다 — 서버가 기본 카드를
  알려주지 않아 그건 목록 순서에 기댄 짐작이었다(`PaymentCheckoutView` 주석 참고).
*/

/**
 * 마스킹 자리에 쓰는 점.
 *
 * `*` 은 '지워진 글자' 로 읽히지만 `•` 은 **아직 안 보이는 자리**로 읽힌다 — 카드 실물의
 * 엠보싱 숫자 자리에 더 가깝고, 별표보다 시각적 무게가 가벼워 앞 네 자리(실제로 읽어야 할
 * 정보)가 먼저 눈에 들어온다.
 */
const MASK_DOT = '•';

/**
 * 마스킹된 카드 번호를 **네 자리씩 끊어** 보여준다. `1276812600000000` → `1276 8126 •••• ••••`
 *
 * 카드 번호를 확인하는 눈은 네 자리 덩어리에 익숙하다(실물 카드·결제창이 전부 그 꼴이다).
 * 열여섯 자가 붙어 있으면 내 카드가 맞는지 대조하려고 손가락으로 짚어 세게 된다.
 *
 * ⚠️ **서버가 어떤 꼴로 주는지 확정되지 않았다**(`types/payment.ts` 의 `cardNumberMasked`).
 * 그래서 아는 꼴일 때만 다시 끊고, **아니면 원본을 그대로 돌려준다** — 결제 직전 화면에서
 * 카드 번호를 우리가 짐작해 고쳐 쓰면 사용자가 대조할 근거를 우리가 망가뜨리는 셈이다.
 */
export const formatCardNumber = (masked: string): string => {
  const compact = masked.replace(/[\s-]/g, '');
  // 카드 번호 길이(13~19)와 아는 문자(숫자·마스킹 기호)를 벗어나면 우리가 아는 값이 아니다.
  if (!/^[0-9*xX•]{13,19}$/.test(compact)) return masked;

  return compact
    .replace(/[*xX]/g, MASK_DOT)
    .replace(/(.{4})/g, '$1 ')
    .trim();
};
