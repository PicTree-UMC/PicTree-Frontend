// types/journey.ts
//
// 화면이 쓰는 형태만 정의한다. 서버 응답 원형(routeId/routeName/recordDate…)은
// api/journeyApi.ts 안에서만 다루고 여기까지 올라오지 않는다.

import type { RoutePlace } from './route';

/**
 * 목록에 실려 오는 장소. `RoutePlace` 에서 **파생**시킨다 — 같은 '동선의 장소'를
 * 두 곳에 정의해 두면 한쪽만 고쳐지기 때문이다.
 *
 * 목록 응답(`GET /routes`)은 이름과 기분만 줘서 `RoutePlace` 를 그대로 쓸 수 없다
 * — `id`·`lat`·`lng`·`date` 를 채울 값이 없다. 좌표가 필요하면 상세를 받아야 한다.
 */
export type Place = Pick<RoutePlace, 'name' | 'mood'>;

/** 동선 사진 앨범의 한 칸. url 이 null 이면 사진 없는 장소 — 앱 아이콘으로 대체한다. */
export interface JourneyPhoto {
  treeId: number;
  placeName: string;
  url: string | null;
}

export interface Journey {
  id: number;
  title: string;
  /** 방문 날짜. '2026년 4월 1일' 로 이미 포맷된 표시용 문자열. */
  date: string;
  /** 방문 날짜 원본('YYYY-MM-DD' 배열). AI 블로그 이동 시 기간 프리필에 쓴다. */
  recordDates: string[];
  /** 저장 날짜. '2026.4.2' 형식. */
  savedAt: string;
  /**
   * 장소 수. `places` 를 세지 않고 서버 값을 그대로 쓴다 —
   * 목록 응답의 `places` 가 미리보기용으로 잘려 올 수 있다.
   */
  placeCount: number;
  places: Place[];
}
