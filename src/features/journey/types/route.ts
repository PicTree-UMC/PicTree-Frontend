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
  /** 장소 설명. 저장된 동선 상세에만 온다. */
  description?: string;
}

/** 저장된 동선 1건의 상세(`GET /routes/{routeId}`). */
export interface RouteDetail {
  id: number;
  name: string;
  /** 저장 날짜. '2026.4.2' 형식. */
  savedAt: string;
  /** 방문 순서대로 정렬된 장소들. */
  places: RoutePlace[];
}
