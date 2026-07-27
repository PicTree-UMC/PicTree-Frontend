/**
 * 백엔드 공통 응답 래퍼.
 *
 * 모든 API 가 이 형태로 감싼다: 실제 payload 는 `data` 안에 있다.
 *   { "success": true, "code": "COMMON200", "message": "...", "data": { ... } }
 *
 * 에러(401/500 등)도 같은 껍데기에 success:false + code/message 로 온다.
 * axios 는 이 껍데기를 response.data 로 주므로, 실제 값은 response.data.data 다.
 *
 * ⚠️ timeline 은 `features/auth/types/auth.ts` 의 다른 타입을 쓰고 있다(다른 담당자 영역).
 *    새 도메인은 이 타입을 쓴다 — 현재 이 래퍼로 언랩하는 건 결제(premium) 도메인이다.
 */
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}
