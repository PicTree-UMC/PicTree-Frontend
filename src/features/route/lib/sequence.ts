import { RoutePlace } from '../types/route';

/**
 * 장소 → 동선 순번(1부터).
 *
 * 규칙이 둘이고, 둘 다 어기기 쉬워서 한곳에 모았다.
 *
 * 1. **켜진 장소에만 번호를 매긴다.** 2번을 끄면 3번이 2번이 되는 재순서화가 여기서 나온다
 *    (화면설계서 7번). 그래서 화면에 보이는 번호는 항상 1부터 빈틈없이 이어진다.
 * 2. **날짜로 거르기 전에 매긴다.** 걸러진 것만 다시 세면 4월 1일만 볼 때 그날 첫 장소가
 *    1번이 되어, 지도 마커·시트 목록·순서 이동 버튼이 서로 다른 번호를 말하게 된다.
 *
 * 세 곳(지도 `useRoutePath`, 시트 `RoutePlaceStrip`, 순서 이동 `RouteViewPage`)이 같은
 * 표를 보게 하려는 것이다 — 각자 세면 언젠가 한 곳만 규칙을 놓친다.
 */
export function buildSequenceMap(
  places: RoutePlace[],
  disabledIds: ReadonlySet<number>,
): Map<number, number> {
  const sequenceById = new Map<number, number>();
  let sequence = 0;

  places.forEach((place) => {
    if (disabledIds.has(place.id)) return;
    sequence += 1;
    sequenceById.set(place.id, sequence);
  });

  return sequenceById;
}
