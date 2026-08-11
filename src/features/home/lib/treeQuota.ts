import { isAxiosError } from 'axios';

/**
 * 하루에 심을 수 있는 나무 수.
 *
 * 노드가 너무 많으면 동선 만들기 ②에서 고르고 푸는 것 자체가 안 되기 때문에 생긴
 * 서버 제한이다(KST 자정 기준, **삭제한 나무는 개수에서 빠진다** — 지우면 다시 열린다).
 *
 * ⚠️ **이 값은 응답에 안 실려 온다.** 스웨거 `POST /trees` 의 설명 문구에만 있어서 여기
 * 베껴 둔 것이고, 서버가 바꾸면 조용히 어긋난다. 그래서 화면을 미리 막는 데만 쓰고
 * **최종 판정은 언제나 서버의 429**(`isDailyTreeLimitError`)다. 백엔드가 `dailyLimit` 을
 * 응답에 실어 주면 이 상수는 지운다.
 */
export const DAILY_TREE_LIMIT = 20;

/**
 * 하루 한도 초과로 저장이 거절됐는지. `POST /trees` 의 `429 TREE429`.
 *
 * 여느 실패와 갈라야 하는 이유는 **다시 시도해도 오늘은 성공하지 않기** 때문이다.
 * "잠시 후 다시 시도해 주세요" 로 뭉뚱그리면 영영 안 될 재시도를 시킨다.
 */
export function isDailyTreeLimitError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;

  const code = (error.response?.data as { code?: string } | undefined)?.code;

  return error.response?.status === 429 || code === 'TREE429';
}
