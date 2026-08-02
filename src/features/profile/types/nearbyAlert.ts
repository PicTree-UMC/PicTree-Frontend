/**
 * 알림 기록 상태. 서버 `NearbyAlertStatus` enum 과 값이 정확히 일치해야 한다.
 *
 * - `PENDING` 기록만 만들어지고 아직 발송 전
 * - `SENT` 발송됨
 * - `OPENED` 사용자가 확인함 (`PATCH .../open` 이 여기로 바꾼다)
 * - `FAILED` 발송 실패 (구독이 만료됐거나 푸시 서비스가 거부)
 */
export const NEARBY_ALERT_STATUSES = [
  'PENDING',
  'SENT',
  'OPENED',
  'FAILED',
] as const;

export type NearbyAlertStatus = (typeof NEARBY_ALERT_STATUSES)[number];

/**
 * `POST /nearby-alerts/check` 응답.
 *
 * `nearbyCount` 와 `sentCount` 는 다르다 — 근처에 나무가 있어도 알림 설정이
 * 꺼져 있거나 푸시 구독이 없으면 `sentCount` 는 0 이다. 이미 오늘 보낸 나무도
 * 다시 세지 않는다.
 */
export interface NearbyAlertCheckResult {
  /** 반경 100m 안에서 찾은 나무 수. */
  nearbyCount: number;
  /** 실제로 푸시를 보낸 수. */
  sentCount: number;
}

/** 알림 기록 한 건. 서버 `NearbyAlertLogResponseDto` 기준이다. */
export interface NearbyAlertLog {
  alertLogId: number;
  treeId: number;
  treeName: string;
  /** 기본 이미지 **식별자**(`"DEFAULT_1"`). URL 이 아니라 `<img src>` 에 못 쓴다. */
  defaultImage: string;
  distanceM: number;
  status: NearbyAlertStatus;
  sentAt: string | null;
  openedAt: string | null;
}

/** `GET /nearby-alerts/logs` 응답의 `data`. */
export interface NearbyAlertLogPage {
  items: NearbyAlertLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
