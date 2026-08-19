import { useQuery } from '@tanstack/react-query';

import { getTokenProducts } from '../api/tokenProductApi';
import type { TokenProduct } from '../types/tokenProduct';

/**
 * 생성권 상품 목록 쿼리 키.
 *
 * 요금제 키(`plans`)와 붙이지 않는다 — 상품은 구독과 별개로 팔리는 일회성 물건이라,
 * 요금제를 바꿨다고 상품 목록이 달라지지 않는다. 같은 접두사로 묶으면 플랜 변경 한 번에
 * 이 목록까지 불필요하게 다시 받는다.
 */
export const tokenProductKeys = {
  all: ['token-products'] as const,
};

/**
 * 구매 가능한 AI 초안 생성권 상품.
 *
 * ⚠️ 지금은 목데이터가 온다(`api/tokenProductApi`). 화면은 그 사실을 몰라도 되게
 * 훅 뒤에 숨겨 둔다 — 서버가 생기면 이 파일은 그대로 두고 API 함수만 바뀐다.
 *
 * 상품 구성은 자주 바뀌는 값이 아니라 오래 들고 있어도 된다. 전역 기본값(60초)보다
 * 길게 잡아 화면을 오갈 때마다 다시 받지 않게 한다.
 */
export const useTokenProducts = () =>
  useQuery<TokenProduct[]>({
    queryKey: tokenProductKeys.all,
    queryFn: getTokenProducts,
    staleTime: 1000 * 60 * 10,
  });
