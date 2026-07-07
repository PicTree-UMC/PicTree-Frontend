/**
 * NOTE: 장소 기록(Record) 모델은 home/journey 피처와 공유될 수 있어,
 *       추후 shared/types 로 옮길 수 있다. (팀 합의 후 이동)
 */

/** 사용자 플랜 (무료 플랜은 최근 3일치까지만 조회 가능) */
export type PlanType = "free" | "premium";

/** 장소 기록 카드 1건 */
export interface TimelineRecord {
  id: string;
  /** 장소명 (예: 오아이스 만난곳) */
  placeName: string;
  /** 한 줄 코멘트 (예: 갤러거 형제 자만추) */
  comment: string;
  /** 기록 시각 ISO 문자열. 정렬 및 날짜 그룹 기준 */
  recordedAt: string;
  /** 사진 썸네일 URL. 없으면 "사진 없이 기록" 상태 */
  thumbnailUrl?: string | null;
  /** 위도/경도 — 삭제 시 지도 마커 동기화에 사용 */
  lat?: number;
  lng?: number;
}

/** 타임라인 조회 응답 (서버가 내려주는 데이터 형태) */
export interface TimelineResponse {
  /** 총 기록 수 */
  totalCount: number;
  /** 기록 목록 (가공 전 원본) */
  records: TimelineRecord[];
  /** 현재 사용자 플랜 — 무료면 제한 배너 노출 */
  plan: PlanType;
}

/** 날짜별로 묶인 그룹 */
export interface TimelineGroup {
  /** 그룹 키 (yyyy-mm-dd) */
  dateKey: string;
  /** 그룹 헤더 라벨 (예: "오늘 - 4월 1일 (수)") */
  label: string;
  records: TimelineRecord[];
}
