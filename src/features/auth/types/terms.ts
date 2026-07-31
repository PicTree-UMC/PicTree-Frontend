/**
 * `GET /terms` 의 개별 약관. 서버 `TermResponseDto` 와 같다.
 *
 * `type` 은 DB 상 자유 문자열(VARCHAR 30)이라 enum 으로 좁히지 않는다. 서버가
 * 새 유형을 추가해도 화면이 깨지지 않아야 한다.
 */
export type Term = {
  id: number;
  title: string;
  /** `SERVICE` · `MARKETING` 등. 화면 설명 문구를 고르는 열쇠로도 쓴다. */
  type: string;
  version: string;
  /** 약관 전문 링크. 없을 수 있다. */
  contentUrl: string | null;
  isRequired: boolean;
  /** 시행일 (ISO 문자열) */
  effectiveFrom: string;
};
