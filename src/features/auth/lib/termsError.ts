import { isAxiosError } from 'axios';

import { getApiErrorMessage } from './apiError';

/**
 * 약관 동의 실패 사유를 화면 문구로.
 *
 * 명세서가 400 `TERMS400`(필수 미동의)·403 `USER403`(이용 불가 계정)·
 * 404 `TERMS404`(없는 약관)를 따로 정의한다. 셋 다 사용자가 할 일이 달라서
 * 서버 메시지를 그대로 흘리는 대신 무엇이 잘못됐는지 알려준다.
 *
 * 404 는 화면이 낡았을 때 난다 — 약관이 개정되면 이전 버전 id 는 사라진다.
 */
export const getTermsErrorMessage = (error: unknown, fallback: string): string => {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  if (status === 400) {
    return '필수 약관에 모두 동의해야 시작할 수 있어요.';
  }

  if (status === 403) {
    return '이용할 수 없는 계정이에요.';
  }

  if (status === 404) {
    return '약관이 변경되었어요. 새로고침 후 다시 시도해주세요.';
  }

  return getApiErrorMessage(error, fallback);
};
