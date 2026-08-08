// types/route.ts
//
// 화면이 쓰는 형태만 정의한다. 서버 응답 원형(routeId/routeName/recordDate…)은
// api/routeApi.ts 안에서만 다루고 여기까지 올라오지 않는다.

/**
 * 지도 위 동선의 장소 하나. 두 모드(새 동선 만들기 / 저장된 동선 보기)가 이 형태를 공유하고,
 * 끄기·번호 재순서화·마커 묶음 로직은 출처를 모른 채 이것만 받는다.
 */
export interface RoutePlace {
  /**
   * 화면 안에서만 쓰는 고유 키(React key · 끄기 대상 식별).
   *
   * **`treeId` 를 그대로 쓰지 않는다** — 같은 나무를 다시 방문하면 한 동선에 같은 id 가 두 번
   * 들어와 칩 하나를 끄면 둘이 같이 꺼진다. 상세 응답에서는 방문 순서(index)로 만든다.
   */
  id: number;
  /** 서버의 나무 식별자. `POST /routes` 가 이것만 받는다. 목 데이터에는 없다. */
  treeId?: number;
  name: string;
  lat: number;
  lng: number;
  date: string; // '2024-03-31' 형식
  /** 기분 이모지('😍'). 저장된 동선 상세에만 온다. */
  mood?: string;
  /**
   * 대표 사진(presigned URL). 사진을 안 올린 장소는 `null` 이라 기본 나무 아이콘으로 그린다.
   * 새 동선을 만들 때만 온다 — 저장된 동선 상세(`GET /routes/{id}`)에는 사진이 없다.
   */
  imageUrl?: string | null;
  /** 장소 설명. 저장된 동선 상세에만 온다. */
  description?: string;
}

/**
 * 목록에 실려 오는 장소. `RoutePlace` 에서 **파생**시킨다 — 같은 '동선의 장소'를
 * 두 곳에 정의해 두면 한쪽만 고쳐지기 때문이다.
 *
 * 목록 응답(`GET /routes`)은 이름과 기분만 줘서 `RoutePlace` 를 그대로 쓸 수 없다
 * — `id`·`lat`·`lng`·`date` 를 채울 값이 없다. 좌표가 필요하면 상세를 받아야 한다.
 */
export type Place = Pick<RoutePlace, 'name' | 'mood'>;

/** 동선 사진 앨범의 한 칸. url 이 null 이면 사진 없는 장소 — 앱 아이콘으로 대체한다. */
export interface RoutePhoto {
  treeId: number;
  placeName: string;
  url: string | null;
}

/**
 * 저장된 동선 1건(목록 `GET /routes` 의 항목).
 *
 * react-router 도 `Route` 를 export 하지만 이 저장소는 `createBrowserRouter` 를 써서
 * 그 컴포넌트를 import 하지 않는다 — 그래서 한정어 없이 `Route` 를 쓸 수 있다.
 * 이름이 실제로 겹치는 건 목록 조회 훅뿐이라 거기만 `useSavedRoutes` 로 피했다.
 */
export interface Route {
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

/** 저장된 동선 1건의 상세(`GET /routes/{routeId}`). */
export interface RouteDetail {
  id: number;
  /**
   * 동선 이름. 서버는 `routeName` 이지만 **화면 용어는 `title` 이다** — 목록의 `Route.title`,
   * 타임라인의 `title → name` 과 같은 규칙이라 서버 이름으로 되돌리지 않는다.
   * 되돌리면 같은 동선 이름을 받은 훅에 따라 다른 프로퍼티로 읽어야 한다.
   */
  title: string;
  /** 저장 날짜. '2026.4.2' 형식. */
  savedAt: string;
  /** 방문 순서대로 정렬된 장소들. */
  places: RoutePlace[];
}
