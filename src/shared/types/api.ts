/**
 * 백엔드 공통 응답 래퍼.
 *
 * 모든 API 가 이 형태로 감싼다: 실제 payload 는 `data` 안에 있다.
 *   { "success": true, "code": "COMMON200", "message": "...", "data": { ... } }
 *
 * 에러(401/500 등)도 같은 껍데기에 success:false + code/message 로 온다.
 * axios 는 이 껍데기를 response.data 로 주므로, 실제 값은 response.data.data 다.
 *
 * **모든 도메인이 이 타입 하나를 쓴다.** 한때 `features/auth/types/auth.ts` 에 명세서
 * 기준의 다른 래퍼(`{ resultType, error, success: { message } }`)가 따로 있었고 auth ·
 * profile · timeline 이 그쪽을 봤는데, 서버가 그 형태를 보낸 적이 없어서 실패 검사
 * 18곳이 전부 무의미했다. 2026-08-08 스웨거 대조로 확인하고 이 타입으로 합쳤다.
 *
 * ⚠️ 래퍼를 또 만들지 말 것. 서버 응답 형태가 바뀌면 여기만 고친다.
 */
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}
