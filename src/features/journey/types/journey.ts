// types/journey.ts
//
// 화면이 쓰는 형태만 정의한다. 서버 응답 원형(routeId/routeName/recordDate…)은
// api/journeyApi.ts 안에서만 다루고 여기까지 올라오지 않는다.

/** 동선에 속한 장소. 서버가 이름과 기분 이모지만 주고 식별자는 주지 않는다. */
export interface Place {
  name: string;
  mood?: string;
}

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
  /** 저장 날짜. '2026.4.2' 형식. */
  savedAt: string;
  /**
   * 장소 수. `places` 를 세지 않고 서버 값을 그대로 쓴다 —
   * 목록 응답의 `places` 가 미리보기용으로 잘려 올 수 있다.
   */
  placeCount: number;
  places: Place[];
}
