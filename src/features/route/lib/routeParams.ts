/** 화면설계서 0번: 한 번에 고를 수 있는 날짜는 3일, 저장할 수 있는 장소는 20개까지. */
export const MAX_DATES = 3;
export const MAX_PLACES = 20;

/** 고른 날짜를 실어 나르는 쿼리 파라미터 이름(`/journey/view?dates=2026-03-31,2026-04-01`). */
export const DATES_PARAM = 'dates';

/** 지도에서 켜둔 장소를 실어 나르는 쿼리 파라미터 이름(`&places=63,75,88`). */
export const PLACES_PARAM = 'places';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TREE_ID = /^\d+$/;

/**
 * `?dates=` → 날짜 배열.
 *
 * **navigate state 가 아니라 URL 로 나른다** — 날짜 고르기와 지도가 두 화면으로 갈리면서
 * 뒤로가기·새로고침·딥링크가 전부 이 값을 되살릴 수 있어야 하기 때문이다. 손으로 친 주소가
 * 들어올 수 있으므로 형식·중복·개수를 여기서 전부 막는다(지도 쪽에서 다시 검사하지 않게).
 */
export function parseDatesParam(value: string | null): string[] {
  if (!value) return [];

  const dates = value.split(',').filter((date) => DATE_KEY.test(date));
  // 지도·하단바의 순번이 날짜 순서를 따라가도록 항상 오름차순으로 유지한다.
  return [...new Set(dates)].sort().slice(0, MAX_DATES);
}

/** 날짜 배열 → `?dates=` 값. */
export function toDatesParam(dates: string[]) {
  return dates.join(',');
}

/**
 * `?places=` → 동선에 넣기로 한 장소의 `treeId` 배열. **없으면(`null`) 전부 켜진 것**이다.
 *
 * **화면용 id(`RoutePlace.id`)가 아니라 `treeId` 를 싣는다** — 화면용 id 는 후보 목록에서의
 * 자리 번호(index)라, 새 나무가 하나 심기면 그 뒤가 전부 한 칸씩 밀린다. 새로고침이나
 * 링크로 되살아나야 하는 값에 자리 번호를 쓰면 엉뚱한 장소가 담긴 채로 열린다.
 * 후보 목록은 `treeId` 로 중복을 걸러 담으므로 그 안에서는 `treeId` 가 유일하다.
 *
 * ⚠️ **꺼진 쪽이 아니라 켜진 쪽을 싣는다.** 처음엔 반대로 만들었는데(`?off=`), 시트에
 * `전체 해제` 가 있어서 실제 사용은 **한 번에 다 끄고 몇 곳만 켜는 쪽**이다 — 그 날짜에 90곳이
 * 있으면 URL 에 87개가 늘어섰다. 켠 쪽은 저장 한도(`MAX_PLACES`)가 상한이라 그럴 일이 없다.
 */
export function parsePlacesParam(value: string | null): number[] {
  if (!value) return [];

  // 정규식으로 거른다 — `Number('')` 가 0 이라 `split` 이 남긴 빈 칸이 **실재하는 treeId 0**
  // 으로 둔갑한다.
  const ids = value
    .split(',')
    .filter((id) => TREE_ID.test(id))
    .map(Number);

  return [...new Set(ids)];
}

/**
 * 켜둔 장소의 `treeId` 배열 → `?places=` 값.
 *
 * 정렬해서 싣는다 — 방문 순서는 후보 목록이 이미 들고 있어서 여기서 나를 필요가 없고,
 * 같은 선택이 늘 같은 URL 이 되면 뒤로가기·새로고침에서 히스토리가 갈라지지 않는다.
 */
export function toPlacesParam(treeIds: number[]) {
  return [...treeIds].sort((a, b) => a - b).join(',');
}
