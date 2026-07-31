import { isAxiosError } from 'axios';

import { getApiErrorMessage } from '@/features/auth/lib/apiError';

/**
 * 즐겨찾기 실패 사유를 화면 문구로.
 *
 * 명세서가 403 `TREE403`(타인의 나무)·404 `TREE404`(없는 나무)를 따로 정의한다.
 * 둘 다 "다시 시도" 로 풀리지 않는 상황이라 서버 메시지를 그대로 흘리는 대신
 * 무엇이 잘못됐는지 알려준다.
 *
 * 404 는 목록이 낡았을 때 실제로 난다 — 다른 기기에서 나무를 지우고 이 화면을
 * 열어 두면 이미 없는 나무를 해제하려 든다.
 */
export const getFavoriteErrorMessage = (error: unknown, fallback: string): string => {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  if (status === 403) {
    return '내 장소가 아니라 변경할 수 없어요.';
  }

  if (status === 404) {
    return '이미 삭제된 장소예요. 목록을 새로고침할게요.';
  }

  return getApiErrorMessage(error, fallback);
};
