import { useEffect, useState } from 'react';
import { RoutePlace } from '../types/route';

/**
 * 겹친 장소를 시트에서 짚어주는 시간. 펼쳐지고 스크롤이 멎기까지가 0.5초 남짓이라
 * 그보다 넉넉해야 하고, 다음 조작을 방해할 만큼 오래 남아 있어도 안 된다.
 */
const HIGHLIGHT_MS = 3000;

interface RoutePlaceFocusOptions {
  places: RoutePlace[];
  /** 지금 걸린 날짜 필터. 짚어줄 묶음이 이 밖을 물고 있는지 판정하는 데만 쓴다. */
  dateFilter: string | null;
  /** 필터를 푸는 길. 묶음이 다른 날짜에 걸쳐 있을 때만 부른다. */
  onClearDateFilter: () => void;
}

export interface RoutePlaceFocus {
  /** 지금 따라가고 있는 장소. 지도가 그리로 옮겨가고 시트도 같은 줄을 보여준다. */
  focusedPlaceId: number | null;
  setFocusedPlaceId: (placeId: number | null) => void;
  /** 지금 시트가 짚어줄 장소들. 잠깐 보였다 사라진다. */
  highlightedPlaceIds: number[];
  /** 지도에서 겹쳐 못 쪼개지는 묶음을 탭했을 때. `useRoutePath` 의 `onOverlappingTap` 으로 간다. */
  handleOverlappingTap: (placeIds: number[]) => void;
}

/**
 * **동선을 짚어가며 보는 조작** 둘을 맡는다 — 순서대로 따라가기와, 겹친 묶음 짚어주기.
 *
 * 따라가기가 있는 이유: 축소하면 번호가 뭉쳐 순서를 못 읽고, 읽히는 배율까지 확대하면 다음
 * 장소가 화면 밖으로 나간다 — 그래서 지도를 손으로 밀어 다음 곳을 찾아야 했다. 순서대로
 * 옮겨 주는 버튼 하나로 그 왕복을 없앤다.
 *
 * 고르기(`useRoutePlaceSelection`)와 갈라 둔 이유는 **동선에 무엇이 담기는지를 전혀 바꾸지
 * 않기 때문**이다. 여기서 만들어지는 값은 화면을 어디로 옮길지만 정하므로 저장에 닿지 않고,
 * 그래서 ② 저장된 동선 보기에서도 그대로 살아 있다(거기 남는 조작이 이 둘과 날짜 필터뿐이다).
 *
 * 두 훅이 맞닿는 곳은 `dateFilter` 하나다 — 아래 `handleOverlappingTap` 이 필터를 풀 때뿐이라
 * 통째로 넘기지 않고 푸는 길(`onClearDateFilter`)만 받는다.
 */
export function useRoutePlaceFocus({
  places,
  dateFilter,
  onClearDateFilter,
}: RoutePlaceFocusOptions): RoutePlaceFocus {
  const [focusedPlaceId, setFocusedPlaceId] = useState<number | null>(null);
  /*
    날짜를 바꾸면 따라가던 자리를 놓는다. 그 하루가 통째로 화면에 담기는 게 먼저고, 이전
    날짜의 장소를 계속 가리키고 있으면 지도가 그리로 되돌아가 버린다.
    끄기·켜기는 그대로 둔다 — 보던 자리는 그대로이고 번호만 당겨진다.
  */
  useEffect(() => setFocusedPlaceId(null), [dateFilter]);

  /*
    지도에서 겹쳐서 못 쪼개지는 묶음을 탭했을 때 시트가 짚어줄 장소들.

    지도가 "여기선 더 확대해도 안 갈라진다"고 답하는 자리라, 그냥 두면 눌러도 아무 일이
    없어 고장처럼 보인다. 겹친 장소들은 시트 목록에 번호대로 이미 다 있으니 거기로 데려간다.

    잠깐 보였다 사라진다 — 계속 남으면 사용자가 지우는 방법을 찾아야 하는 상태가 하나 는다.
    같은 묶음을 다시 탭하면 배열이 새로 와서(내용이 같아도) 다시 짚어준다.
  */
  const [highlightedPlaceIds, setHighlightedPlaceIds] = useState<number[]>([]);

  useEffect(() => {
    if (highlightedPlaceIds.length === 0) return;

    const timer = setTimeout(() => setHighlightedPlaceIds([]), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedPlaceIds]);

  /**
   * 겹쳐서 못 쪼개지는 묶음 탭.
   *
   * **다른 날짜가 섞여 있을 때만 필터를 푼다** — 필터가 걸린 채로 짚으면 목록에 없는 줄을
   * 가리키게 되기 때문이다. 지도도 같이 걸러지면서 묶음이 필터 밖 장소를 물고 있는 일은
   * 사실상 없어졌지만, 그렇다고 늘 풀어버리면 방금 좁혀 본 하루가 통째로 되돌아간다.
   */
  const handleOverlappingTap = (placeIds: number[]) => {
    const tapped = new Set(placeIds);
    const spansOtherDates =
      dateFilter !== null &&
      places.some((place) => tapped.has(place.id) && place.date !== dateFilter);

    if (spansOtherDates) onClearDateFilter();
    setHighlightedPlaceIds(placeIds);
  };

  return { focusedPlaceId, setFocusedPlaceId, highlightedPlaceIds, handleOverlappingTap };
}
