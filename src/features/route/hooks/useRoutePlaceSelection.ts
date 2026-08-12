import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PLACES_PARAM, parsePlacesParam } from '../lib/routeParams';
import { buildSequenceMap } from '../lib/sequence';
import { RoutePlace } from '../types/route';

export interface RoutePlaceSelection {
  /** 꺼둔 장소. 목록에는 남고 번호·개수·지도에서만 빠진다(화면설계서 7번). */
  disabledIds: ReadonlySet<number>;
  /** 동선에 실제로 담기는 장소. 날짜 필터와 무관하다 — 저장되는 범위가 이것이다. */
  activePlaces: RoutePlace[];
  /** 따라가기가 훑는 범위 — 보이는 것 중 켜진 것만. */
  steppablePlaces: RoutePlace[];
  /** 보이는 장소가 전부 켜져 있는가. 버튼 문구를 정한다. */
  allVisibleSelected: boolean;
  /** 장소 → 동선 순번. 지도·시트·따라가기가 같은 표를 본다. */
  sequenceById: Map<number, number>;
  /** 지금 들여다보는 날짜. `null` 이면 전부. */
  dateFilter: string | null;
  setDateFilter: (date: string | null) => void;
  togglePlace: (placeId: number) => void;
  toggleAllVisible: () => void;
}

/**
 * 지도 화면의 **고르기 상태 머신**. 무엇을 동선에 담고 무엇을 들여다볼지가 전부 여기 있다.
 *
 * **상태는 둘뿐이고 나머지는 전부 파생이다** — 꺼둔 장소 목록과 날짜 필터. 특히 날짜의
 * 켬/끔은 따로 들지 않고 **"그날 장소가 전부 꺼졌는가"로 도출한다**(설계서 7번의 날짜 연동이
 * 특수 처리 없이 따라오는 이유).
 *
 * 받는 것이 `places`·`dates` 둘뿐이라 **두 모드를 구분하지 않는다** — 저장된 동선을 볼 때
 * 시트가 읽기 전용인 것은 페이지가 조작을 안 넘겨서지 이 훅이 아는 일이 아니다.
 */
export function useRoutePlaceSelection(
  places: RoutePlace[],
  dates: string[],
): RoutePlaceSelection {
  const [searchParams] = useSearchParams();

  /*
    하단바에서 꺼둔 장소(설계서 7번). 목록에는 남기고 번호·개수·동선에서만 뺀다.

    **손대기 전까지는 URL(`?places=`)이 진실이고, 한 번 만지면 그때부터 로컬 상태가 진실이다.**
    ③단계에서 뒤로 오면 이 화면이 다시 마운트되므로 상태만으로는 다듬어 놓은 게 전부 되살아난다
    — 앞 단계의 `?dates=` 와 같은 이유, 같은 방식이다. effect 로 URL 을 상태에 옮겨 담지 않는
    이유는 후보 목록이 도착하기 전 한 프레임 동안 **전부 켜진 동선**이 지도에 그려지기 때문이다.

    URL 은 **켜진 것**을 `treeId` 로 말하고 여기는 **꺼진 것**을 화면용 id 로 센다. 양쪽이
    뒤집혀 있는 데는 각자 이유가 있다:
    - URL 이 켜진 쪽인 건 길이 때문이다(`parsePlacesParam` 주석).
    - 여기가 꺼진 쪽인 건 ② 때문이다 — 저장된 동선을 볼 땐 URL 에 목록이 없고, 아무것도 안
      건드린 상태가 곧 '전부 켜짐'이라 빈 배열이 기본값이 된다.
    - URL 이 `treeId` 인 건 화면용 id 가 후보 목록의 자리 번호라서고, 여기가 화면용 id 인 건
      ② 에서 같은 나무를 두 번 방문한 동선이 있을 수 있어서다(`RoutePlace.id` 주석).
  */
  const keptTreeIds = useMemo(() => {
    const raw = searchParams.get(PLACES_PARAM);
    // 파라미터 자체가 없으면 '전부 켜짐' — 지도로 처음 들어온 길이다. 빈 문자열과 구분해야 해서
    // `parsePlacesParam` 의 결과가 아니라 `raw` 로 판정한다.
    return raw === null ? null : new Set(parsePlacesParam(raw));
  }, [searchParams]);

  const [touchedDisabledIds, setTouchedDisabledIds] = useState<number[] | null>(null);
  /* ⚠️ 반드시 메모해야 한다 — 매 렌더 새 배열이면 아래 `disabledIds`(Set)도 매번 새것이 되고,
     그걸 의존성으로 받는 `useRoutePath` 의 effect 가 렌더마다 지도를 다시 그린다. */
  const disabledPlaceIds = useMemo(
    () =>
      touchedDisabledIds ??
      (keptTreeIds === null
        ? []
        : places
            // treeId 가 없는 장소는 켜 둔다 — 어차피 저장 단계에서 걸리고, 조용히 빠지는 것보다
            // 목록에 남아 있는 편이 왜 안 되는지 찾기 쉽다.
            .filter((place) => place.treeId !== undefined && !keptTreeIds.has(place.treeId))
            .map((place) => place.id)),
    [touchedDisabledIds, places, keptTreeIds],
  );

  const disabledIds = useMemo(() => new Set(disabledPlaceIds), [disabledPlaceIds]);
  const activePlaces = useMemo(
    () => places.filter((place) => !disabledIds.has(place.id)),
    [places, disabledIds],
  );

  /*
    지금 들여다보는 날짜. `null` 이면 전부. **시트 목록과 지도가 같이 좁혀진다.**

    **보기만 거른다** — 걸러진 날짜의 장소도 동선에는 그대로 남고 번호도 유지된다(저장되는
    범위는 `activePlaces` 이고 이 필터와 무관하다). 예전엔 날짜 칩이 그날 장소를 통째로 껐다
    켰는데, 한 손짓에 '보기'와 '넣기/빼기'가 겹쳐 있어서 그날만 들여다보려고 눌렀다가
    동선에서 빠지는 일이 났다. 넣고 빼기는 `전체 선택`/`전체 해제` 와 줄 탭이 맡는다.

    고른 날짜가 목록에서 사라질 수 있어(② 에서 동선을 다시 받아오면 날짜 집합이 바뀐다)
    상태를 그대로 믿지 않고 매번 걸러 쓴다 — effect 로 되돌리면 한 프레임 동안 빈 목록이 뜬다.
  */
  const [pickedDateFilter, setPickedDateFilter] = useState<string | null>(null);
  const dateFilter =
    pickedDateFilter !== null && dates.includes(pickedDateFilter) ? pickedDateFilter : null;

  /** 지금 목록에 보이는 장소들. `전체 선택`/`전체 해제` 가 대상으로 삼는 범위이기도 하다. */
  const visiblePlaces = useMemo(
    () => (dateFilter === null ? places : places.filter((place) => place.date === dateFilter)),
    [places, dateFilter],
  );

  const allVisibleSelected =
    visiblePlaces.length > 0 && visiblePlaces.every((place) => !disabledIds.has(place.id));

  /*
    따라가기가 훑는 범위는 **지금 보고 있는 것과 같다** — 날짜를 걸렀으면 그 하루만, 꺼둔
    장소는 건너뛴다. 번호는 전체 기준을 그대로 쓰므로(`sequenceById`) 4월 1일만 볼 때도
    `3. 도담도담` 이다.
  */
  const sequenceById = useMemo(() => buildSequenceMap(places, disabledIds), [places, disabledIds]);
  const steppablePlaces = useMemo(
    () => visiblePlaces.filter((place) => !disabledIds.has(place.id)),
    [visiblePlaces, disabledIds],
  );

  /**
   * 장소 칩 탭(설계서 7번). 그 장소를 껐다 켜고, 켜진 것만 세어 번호를 다시 매긴다.
   * 마지막 남은 장소를 끄면 그 날짜 칩도 함께 흐려진다 — 날짜의 켬/끔이 여기서 도출되기 때문이다.
   */
  const togglePlace = (placeId: number) =>
    setTouchedDisabledIds(
      disabledPlaceIds.includes(placeId)
        ? disabledPlaceIds.filter((id) => id !== placeId)
        : [...disabledPlaceIds, placeId],
    );

  /**
   * `전체 선택`/`전체 해제`(설계서 6번). **지금 보이는 범위**에만 적용된다 — 날짜를 걸러
   * 놓았으면 그 날짜만, 전체를 보고 있으면 동선 전체.
   *
   * 하나라도 꺼져 있으면 전부 켜고, 전부 켜져 있을 때만 끈다. '거의 다 켜진' 상태에서
   * 눌렀을 때 남은 몇 개를 마저 켜주는 쪽이, 애써 켠 걸 통째로 지우는 것보다 되돌리기 쉽다.
   */
  const toggleAllVisible = () => {
    const idsOfVisible = visiblePlaces.map((place) => place.id);
    if (idsOfVisible.length === 0) return;

    setTouchedDisabledIds(
      allVisibleSelected
        ? [...new Set([...disabledPlaceIds, ...idsOfVisible])]
        : disabledPlaceIds.filter((id) => !idsOfVisible.includes(id)),
    );
  };

  return {
    disabledIds,
    activePlaces,
    steppablePlaces,
    allVisibleSelected,
    sequenceById,
    dateFilter,
    setDateFilter: setPickedDateFilter,
    togglePlace,
    toggleAllVisible,
  };
}
