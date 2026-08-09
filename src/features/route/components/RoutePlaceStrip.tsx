import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Photo } from '@/shared/components';
import { RoutePlace } from '../types/route';
import { formatDateLabel } from '../lib/formatDate';
import { buildSequenceMap } from '../lib/sequence';

interface RoutePlaceStripProps {
  places: RoutePlace[];
  /** 사용자가 꺼둔 장소. 목록에는 남되 번호·개수·지도에서 빠진다(화면설계서 7번). */
  disabledPlaceIds: ReadonlySet<number>;
  /**
   * 들여다볼 날짜. `null` 이면 전부. **거르는 칩 줄은 이 시트에 없다** — 시트 바로 위에
   * 얹혀 있고, 여기서는 어느 범위를 그릴지 알기 위해 값만 받는다.
   *
   * **보기만 거른다 — 동선에서 빼는 게 아니다.** 걸러진 날짜의 장소도 동선에 그대로 남고
   * 번호도 유지된다. 빼고 넣는 건 `onToggleAllVisible` 과 줄 탭이 맡는다.
   */
  dateFilter: string | null;
  /** 지금 보이는 장소가 전부 켜져 있는가. 버튼 문구를 정한다. */
  allVisibleSelected: boolean;
  /** 지금 보이는 장소를 통째로 켜거나 끈다. */
  onToggleAllVisible: () => void;
  /**
   * 저장 한도. **저장된 동선을 볼 때는 넘기지 않는다** — 이미 저장된 것이라 한도가 의미 없고,
   * `3/20개` 처럼 보이면 더 담을 수 있다는 오해를 준다. 없으면 `장소 n개` 로만 쓴다.
   */
  maxPlaces?: number;
  /**
   * 동선 저장. **저장된 동선을 볼 때는 넘기지 않는다** — 이미 저장된 것이라 버튼째 사라진다.
   * 켜진 장소가 없거나 한도를 넘었는지는 부모가 눌린 뒤에 검사한다(막지 않고 이유를 알려준다).
   */
  onSave?: () => void;
  onTogglePlace: (placeId: number) => void;
  /**
   * 접힘 상태는 **부모가 들고 있다.** 지도가 화면을 맞출 때 시트가 덮는 높이를 빼야 하는데,
   * 그 값이 접힘에 따라 달라지기 때문이다(`SHEET_EXPANDED_RATIO` / `SHEET_COLLAPSED_PX`).
   */
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /**
   * 지금 짚어줄 장소들. 지도에서 **겹쳐서 못 쪼개지는 묶음**을 탭했을 때 채워진다 —
   * 그 자리에선 더 확대해도 안 갈라지므로, 대신 목록에서 어느 장소들인지 보여준다.
   * 새 배열이 오면(같은 장소를 다시 탭해도) 시트가 펼쳐지고 첫 줄로 스크롤한다.
   */
  highlightedPlaceIds?: readonly number[];
  /**
   * 지금 따라가고 있는 장소. 지도가 그리로 옮겨간 참이라 **목록도 같은 줄을 보여준다** —
   * 이름과 사진은 여기에만 있어서, 목록이 딴 데를 보고 있으면 지도와 시트가 다른 말을 한다.
   *
   * 짚어주기(`highlightedPlaceIds`)와 달리 **사라지지 않는다.** 따라가는 동안 계속 유지되는
   * 자리라서 띠를 옅게(GREEN-100) 깔아 목록을 훑는 데 방해되지 않게 한다.
   */
  focusedPlaceId?: number | null;
  /**
   * 동선 따라가기 줄(`RouteNodeStepper`). **손잡이 바로 아래, 접혀도 남는 자리**에 놓인다 —
   * 접어 둔 채 지도만 보며 따라가는 게 이 기능의 주 사용법이라 접히는 영역에 두면 안 된다.
   *
   * 있으면 접혔을 때 뜨던 `전체 동선` 제목을 대신한다: 접힌 시트가 무엇인지는 이 줄이 이미
   * 말하고 있어서, 둘을 같이 두면 같은 말을 두 줄로 하며 지도만 더 가린다.
   *
   * **훑을 게 없으면 부모가 아예 안 넘긴다**(그때는 제목이 그대로 뜬다).
   */
  stepper?: ReactNode;
  /**
   * 동선 이름 입력 줄(`RouteNameField`). 주면 **머리 줄이 따라가기 대신 이 줄이 되고,
   * 맨 아래 `동선저장` 이 빠진다**(저장은 네비바 오른쪽으로 간다).
   *
   * 그 밖에는 아무것도 안 바뀐다 — 날짜 필터도 장소 목록도 그대로다. 이름 짓기는 화면을
   * 갈아끼우는 단계가 아니라 **줄 하나가 바뀌는 일**이고, 저장 직전이야말로 무엇이
   * 저장되는지 보이는 게 맞다. 빠지는 줄과 들어오는 줄이 높이가 엇비슷해 목록 자리도
   * 사실상 그대로다.
   *
   * 예전에는 이 위로 두 번째 바텀시트(`SaveRouteSheet`)가 올라왔다 — 손잡이 둘이 겹쳐
   * 무엇을 내리면 무엇이 닫히는지 알 수 없었다. **시트가 이미 있으면 새로 띄우지 않는다.**
   */
  nameField?: ReactNode;
}

/**
 * 펼친 시트가 차지하는 화면 높이(50dvh).
 *
 * **장소 수와 무관하게 고정이다.** 예전엔 목록에 상한(180px)만 주고 나머지를 내용이
 * 정하게 뒀는데, 그러면 카드 수에 따라 시트 높이가 100px 남짓 오르내려서 **지도가 시트에
 * 얼마나 가리는지를 알 수 없었다.** 지도는 마커가 전부 담기게 화면을 맞추면서 시트 높이만큼
 * 아래를 비워둬야 하는데, 그 값이 매번 달라지면 재는 수밖에 없다. 고정해 두면 계산으로 안다.
 *
 * 390×844 기준 422px — 손잡이·머리 줄·개수줄·저장 버튼을 뺀 목록 자리가 200px 남짓으로,
 * 줄 하나(72px)로 치면 **2.8줄**이다. 반 줄이 걸쳐 보여야 목록이 더 있다는 게 읽히므로
 * (딱 떨어지게 잘리면 거기서 끝난 줄 알고 아무도 안 굴린다) 그 여유가 남게 잡았다.
 *
 * 45dvh 였는데 필터와 개수줄 사이 간격을 넓히면서 그만큼 목록에서 빠져 올렸다.
 * 따라가기 줄이 지도 위 알약에서 시트 안으로 들어오면서 목록이 2.8 → 2.2줄로 줄었다가,
 * **날짜 칩이 반대로 지도 위로 올라가면서 2.8줄로 돌아왔다.** 그래도 높이는 그대로 둔다 —
 * 시트를 키우면 칩을 내보내며 되찾은 지도를 도로 내주는 셈이다.
 * 작은 기기(667px)에선 한 줄 남짓, 큰 기기에선 세 줄 넘게.
 */
export const SHEET_EXPANDED_RATIO = 0.5;

/**
 * 접었을 때 남는 높이. 손잡이 + 따라가기 줄(없으면 `전체 동선` 줄) + 저장 버튼 + 안전영역의
 * 어림값이다.
 *
 * **지도 패딩에만 쓰는 값이라 어림으로 충분하다** — 레이아웃은 여전히 내용이 정한다.
 * 접힌 시트는 화면을 조금만 먹으므로 몇 px 어긋나도 마커가 가려지지 않는다.
 * (저장된 동선 보기에는 저장 버튼이 없어 실제로는 이보다 낮다 — 지도 아래가 조금 더 빌 뿐이다.)
 */
export const SHEET_COLLAPSED_PX = 155;

/** 짚어준 줄 위에 남기는 여백. 위에 이전 줄이 살짝 걸쳐 보여야 목록 중간이라는 게 읽힌다. */
const HIGHLIGHT_SCROLL_MARGIN_PX = 12;

/** 손가락이 이만큼 세로로 움직이면 탭이 아니라 끌기로 본다. */
const DRAG_THRESHOLD_PX = 8;

/**
 * 시트를 잡고 위아래로 끌어 접고 펴는 조작. 카카오맵 하단 패널과 같은 감각이다.
 *
 * 끌기를 **위아래 끝(손잡이·저장 버튼 줄)에만** 붙인다 — 가운데 장소 목록도 세로로 움직이는
 * 영역이라, 거기서 세로 제스처를 가로채면 목록을 굴리려는 손짓이 전부 시트 접기로 먹힌다.
 */
function useCollapseDrag(setCollapsed: (collapsed: boolean) => void) {
  const startYRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  return {
    /** 끌기가 있었으면 뒤이어 오는 click 을 삼킨다(접었다 곧바로 다시 펴지는 걸 막는다). */
    consumeDrag: () => {
      const dragged = draggedRef.current;
      draggedRef.current = false;
      return dragged;
    },
    handlers: {
      onPointerDown: (event: ReactPointerEvent) => {
        startYRef.current = event.clientY;
        draggedRef.current = false;
        // 캡처하지 않으면 손가락이 패널 밖으로 나가는 순간 move 가 끊긴다.
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: ReactPointerEvent) => {
        const startY = startYRef.current;
        if (startY === null) return;

        const dy = event.clientY - startY;
        if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;

        draggedRef.current = true;
        setCollapsed(dy > 0); // 내리면 접고 올리면 편다
        startYRef.current = null; // 한 번 판정하면 끝 — 같은 끌기로 되풀이되지 않게
      },
      onPointerUp: () => {
        startYRef.current = null;
      },
      onPointerCancel: () => {
        startYRef.current = null;
      },
    },
  };
}

/**
 * 화면 하단의 동선 시트. **이 시트가 다루는 건 하나다 — 동선에 무엇을 넣을지.**
 * 장소를 켜고 끄고, 몇 곳인지 세고, 이름을 지어 저장한다.
 *
 * 날짜 필터 칩은 여기 없다. **시트 바로 위**에 얹혀 있다(`RouteViewPage`). 칩은 지도와 목록의
 * **보기 범위**를 정하는 것이라 화면에 걸친 조작이고, 이 시트 안에 있는 동안에는 시트를 접으면
 * 칩이 같이 숨는 반면 지도는 계속 걸러진 채여서 왜 하루치만 보이는지 화면에 남는 게 없었다.
 * **어디에 두느냐는 '무엇에 작용하느냐'를 따른다** — 저장 버튼이 헤더에서 이리로 내려온
 * 것도 같은 기준이다(저장되는 건 이 목록이라 `n/20` 옆에 있어야 한다).
 *
 * 위에서부터 **따라가기 줄**(한 곳씩 짚어가기 / 이름 짓기 중엔 이름 입력) →
 * **개수·전체 선택 줄** → **장소 목록**(하나씩 다루기) → **저장 버튼**. 가운데만 여닫히고,
 * 머리 줄과 저장 버튼은 위아래에 붙박이다 — 접을 때 버튼이 위아래로 뛰어다니면 어디를
 * 누르려던 건지 놓친다.
 *
 * **접으면 머리 줄과 `동선저장` 만 남는다.** 접기는 지도를 넓게 보려는 것이지 작업을
 * 멈추는 게 아니라서 저장은 손에 닿아야 하고, 따라가기는 접어 놓고 지도만 볼 때 오히려
 * 더 쓰인다. 그 밖의 것은 지도에 자리를 내준다.
 *
 * **장소는 세로 목록이고 시트 안에서 스크롤한다.** 가로로 늘어놓던 시절엔 20곳이면 오른쪽
 * 끝까지 밀어야 했고, 화면 폭이 정한 칸에 이름을 욱여넣느라 사진과 날짜를 같이 못 보여줬다.
 * 세로로 세우면 한 줄이 화면 폭을 다 쓰므로 사진·이름·날짜가 한눈에 들어오고, 위아래 순서가
 * 곧 방문 순서라 번호와 두 번 말하는 셈이 된다.
 *
 * 목록만 굴러간다 — 날짜 필터와 저장 줄은 위아래에 붙박이라 굴리는 내내 제자리에 있다.
 *
 * ⚠️ **사진은 ① 새 동선 만들기에만 온다** — 저장된 동선 상세(`GET /routes/{id}`)에는 없어서
 * ② 는 전부 기본 나무 아이콘이 된다. 서버가 사진을 실어주면 그대로 채워진다.
 *
 * 이름은 고른 날짜 수와 무관하게 '전체 동선' 하나다 — 날짜별 구분은 필터와 지도가 맡는다.
 * 새 동선을 만들 때만 장소 수를 n/20 으로 보여준다 — 저장 한도가 20개이기 때문(설계서 0·2번).
 *
 * 줄을 누르면 그 장소가 꺼지고 **뒤 번호가 당겨진다**(설계서 7번). 켠 장소만 세기 때문에
 * 화면에 보이는 번호는 항상 1부터 빈틈없이 이어진다.
 *
 * **접을 수 있다**(손잡이 탭, 또는 손잡이·저장 줄에서 끌기). 지도가 이 화면의 본체인데
 * 시트가 아래를 계속 물고 있으면 남쪽 마커가 가려진다.
 *
 * **`동선저장` 을 누르면 머리 줄이 이름 입력으로 갈리고 저장은 네비바로 간다**(`nameField`).
 * 예전에는 그 위로 두 번째 바텀시트가 올라왔다 — 손잡이 두 개가 겹쳐 무엇을 내리면 무엇이
 * 닫히는지 알 수 없었다. 시트가 이미 있으면 새로 띄우지 않고, 이 시트도 화면을 갈아끼우지
 * 않는다: **줄 하나가 바뀔 뿐 날짜 필터도 목록도 높이도 그대로다.**
 */
export function RoutePlaceStrip({
  places,
  disabledPlaceIds,
  dateFilter,
  allVisibleSelected,
  onToggleAllVisible,
  maxPlaces,
  onSave,
  onTogglePlace,
  highlightedPlaceIds,
  focusedPlaceId,
  collapsed,
  onCollapsedChange,
  stepper,
  nameField,
}: RoutePlaceStripProps) {
  const activeCount = places.filter((place) => !disabledPlaceIds.has(place.id)).length;

  /**
   * 켠 장소가 저장 한도를 넘었는가. **넘은 채로는 저장할 수 없다** — 개수 줄을 ERROR 로
   * 물들이고 `동선저장` 을 잠근다.
   *
   * 예전에는 눌러야 토스트로 알려줬다. 그런데 `100/20개` 는 이미 화면에 떠 있는 사실이라,
   * 눌러 보기 전까지 그게 막힌 상태인 줄 몰랐다 — **문제를 들고 있는 줄이 직접 말하는 게 맞다.**
   * (한도가 없는 ② 저장된 동선 보기에서는 `maxPlaces` 자체가 안 온다.)
   */
  const overLimit = maxPlaces !== undefined && activeCount > maxPlaces;
  const drag = useCollapseDrag(onCollapsedChange);
  const listRef = useRef<HTMLUListElement>(null);
  const highlighted = new Set(highlightedPlaceIds ?? []);

  /**
   * 목록을 그 줄까지 굴린다.
   *
   * ⚠️ `scrollIntoView` 를 쓰지 않는다 — 조상 스크롤 컨테이너까지 함께 움직일 수 있다.
   * 이 목록의 `scrollTop` 만 건드린다(`RouteChips` 와 같은 이유).
   * 위치는 `offsetTop` 이 아니라 rect 차이로 잰다 — 줄(`li`)이 `relative` 라 `offsetParent`
   * 가 목록이 아니어서 `offsetTop` 이 엉뚱한 기준을 가리킨다.
   */
  const scrollToPlace = (placeId: number) => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-place-id="${placeId}"]`);
    if (!list || !row) return;

    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top: Math.max(top - HIGHLIGHT_SCROLL_MARGIN_PX, 0), behavior: 'smooth' });
  };

  /*
    짚어줄 장소가 생기면 시트를 펼치고 그 줄까지 굴려서 보여준다.

    접혀 있으면 목록 자체가 안 보이므로 펴는 게 먼저다 — 접기는 사용자가 지도를 넓게
    보려고 한 선택이지만, 지도가 "여기선 더 못 보여준다"고 답한 참이라 시트가 이어받는다.
  */
  useEffect(() => {
    if (!highlightedPlaceIds || highlightedPlaceIds.length === 0) return;

    onCollapsedChange(false);
    // scrollToPlace 는 ref 만 읽으므로 의존성에 넣지 않는다(매 렌더 새로 만들어진다).
    scrollToPlace(highlightedPlaceIds[0]);
  }, [highlightedPlaceIds, onCollapsedChange]);

  /*
    따라가는 자리가 바뀌면 목록도 그 줄로 옮겨간다. **시트를 펴지는 않는다** — 접어 둔 채
    지도만 보며 따라가는 것도 멀쩡한 사용법이라, 접기를 되돌리는 건 사용자 선택을 뒤엎는다.
  */
  useEffect(() => {
    if (focusedPlaceId == null || collapsed) return;

    scrollToPlace(focusedPlaceId);
  }, [focusedPlaceId, collapsed]);

  // 번호는 켜진 장소에만, 거르기 전에 붙는다 — 규칙은 `buildSequenceMap` 이 들고 있다.
  const sequenceById = buildSequenceMap(places, disabledPlaceIds);

  return (
    /*
      바닥은 흰색이다 — 가이드라인이 '배경 · 카드/시트/탭바' 에 지정한 역할색(#FFFFFF).
      GREEN-300 연초록이었는데, 그것도 팔레트 안의 값(보조 면)이긴 하나 **패널의 색이지
      시트의 색이 아니다.** 바꾸면서 안쪽 요소도 같이 뒤집혔다: 크림으로 띄우던 것들
      (날짜 칩·손잡이·`제외됨`)은 흰 바닥에선 안 보이므로 각각 제 역할색을 찾아갔다.
    */
    <div
      /*
        ⚠️ **가로 여백은 시트가 주지 않는다 — 안쪽 줄들이 각자 갖는다.** 시트가 `px-5` 를
        가지면 접히는 영역(`overflow-hidden`)이 그 여백선에서 잘라내서, 목록이 `-mx-5` 로
        밖으로 나가려 해도 소용이 없다. 그래서 줄에 깔린 배경색이 좌우 20px 를 못 덮고
        흰 띠가 남았다. 시트를 끝까지 열어 두고 여백은 줄이 padding 으로 갖는다.

        ⚠️ **이름 짓기로 넘어가도 높이는 그대로다.** 한때 폼 높이에 맡겼더니 시트가 그 순간
        훅 줄어들면서, 없애려던 바로 그 인상(딴 시트가 떴다)이 되돌아왔다. 지금은 목록을
        치우지 않으므로 아예 조건이 없다 — 머리 줄이 갈리고 저장 버튼이 네비바로 갈 뿐이다.
      */
      className={`flex flex-col rounded-t-[20px] bg-white pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] ${
        collapsed ? '' : 'h-[50dvh]'
      }`}
    >
      {/* touch-none: 세로 끌기를 브라우저 기본 제스처에 뺏기지 않게.
          손잡이와 맨 아래 줄에만 건다 — 가운데 목록은 저희끼리 굴러가야 한다. */}
      <div className="shrink-0 touch-none px-5" {...drag.handlers}>
        <button
          type="button"
          onClick={() => {
            if (drag.consumeDrag()) return;
            onCollapsedChange(!collapsed);
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? '동선 목록 펼치기' : '동선 목록 접기'}
          className="flex w-full justify-center py-2"
        >
          {/* 손잡이는 흰 바닥에서 유일하게 '선'인 요소라 LINE 회색을 쓴다. 크림이었을 땐
              초록 바닥 위에서 밝게 떠 보였지만 흰 바닥에선 아예 사라진다. */}
          <span className="h-1 w-10 rounded-full bg-[#d9d9d9]" />
        </button>

        {/* 접혔을 때만. 그때는 시트가 무엇인지 말해줄 게 이 한 줄뿐이다 — 펼치면 목록이
            이미 그 말을 하고 있어서 자리만 먹는다.
            머리 줄(따라가기 / 이름 입력)이 있으면 그쪽이 이 말을 대신한다. */}
        {collapsed && !stepper && !nameField && (
          <h2 className="truncate pb-1 pt-1 text-[15px] font-medium tracking-tight text-[#2c3930]">
            전체 동선
          </h2>
        )}
      </div>

      {/* 머리 줄 — 이름 짓기 중이면 입력 한 줄, 아니면 동선 따라가기. **둘은 같은 자리를
          나눠 쓴다**: 이름을 짓는 동안 한 곳씩 짚어갈 일이 없고, 자리를 겹쳐 두면 줄이
          늘지 않아 아래 목록이 그대로 남는다.

          접히는 영역 **밖**이라 접어도 남는다 — 접어 놓고 지도만 보며 따라가는 것도,
          접어 놓고 이름만 짓는 것도 멀쩡한 사용법이다.
          ⚠️ 끌기 영역(`drag.handlers`) 안에 넣지 않는다 — 화살표나 입력을 누르려다 손가락이
          조금 밀리면 시트가 접힌다. 시트를 잡는 자리는 손잡이와 저장 줄이다. */}
      {nameField ?? stepper}

      {/* 접히는 영역. 펼쳤을 때 시트에 남는 자리를 전부 차지하고(`flex-1`), 그 안에서 목록이
          다시 남는 자리를 갖는다 — 시트 높이가 `SHEET_EXPANDED_RATIO` 로 고정이라 목록에 따로
          상한을 줄 필요가 없어졌다. `max-h-*` 두 값은 여닫는 애니메이션의 끝점이다(높이가
          `auto` 면 전환이 안 붙는다). 펼친 끝점은 시트 높이와 같은 50dvh — 항상 실제 높이보다
          크므로 값을 제한하지 않는다. */}
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[50dvh] opacity-100'
        }`}
        // 접힌 동안 개수 줄·목록이 보이지 않는데도 탭 순서·스크린리더에 남는 걸 막는다.
        // (`overflow:hidden` 은 시각만 자르지 초점은 그대로 들어간다.)
        inert={collapsed}
      >
        {/* 목록 위에 붙는 줄: 지금 몇 곳이고, 한 번에 넣거나 뺄 수 있다.
            문구는 지금 상태가 아니라 **누르면 무슨 일이 일어나는지**를 말한다.

            **날짜 필터 칩이 이 위에 있었고 지금은 시트 바로 위로 나갔다.** 칩은 지도와 목록의
            보기 범위를 정하는 것이라 시트 안일 이유가 없다 — 시트를 접으면 칩이 같이 숨는데
            지도는 계속 걸러진 채라, 왜 하루치만 보이는지 화면에 남는 게 없었다.
            이제 이 시트는 **동선에 무엇을 넣을지** 하나만 다룬다.
            `전체 선택`/`전체 해제` 는 여전히 걸린 필터 범위에 적용된다(그 범위가 곧 아래
            목록이라, 칩이 멀어져도 무엇에 걸리는지는 목록이 말해 준다). */}
        <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
          {/* 색이 GREEN-500 이었다 — 연초록 바닥 위 2.35:1 로, 가이드라인이 결함이라고
              집어둔 조합이다. 보조 텍스트 자리이므로 INK-muted(흰 위 5.98:1).
              한도를 넘으면 ERROR 로 갈아입고 medium 을 얹는다 — 이 줄이 지금 화면에서
              유일하게 잘못된 것이라 옆의 `전체 해제` 와 무게가 같으면 안 된다. */}
          <p
            className={`min-w-0 flex-1 truncate text-[13px] ${
              overLimit ? 'font-medium text-[#dc2626]' : 'text-[#60655c]'
            }`}
          >
            장소 {maxPlaces === undefined ? activeCount : `${activeCount}/${maxPlaces}`}개
          </p>

          {/* 글자는 13px 한 줄이라 그대로 두면 누를 자리가 20px 도 안 된다. 음수 마진으로
              **줄 간격은 그대로 두고 누를 자리만** 40px 가까이로 넓힌다(권장 터치 영역). */}
          <button
            type="button"
            onClick={onToggleAllVisible}
            className="-my-2.5 shrink-0 py-2.5 text-[13px] font-medium text-[#60655c] underline underline-offset-2"
          >
            {allVisibleSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {/* 빨간 숫자만으로는 '많다'는 것만 읽히고 **어떻게 하라는 건지**가 없다. 개수 줄은
            `전체 해제` 와 폭을 나눠 갖느라 문구가 안 들어가서 아래에 한 줄로 붙인다 —
            날짜 칩이 지도 위로 올라가며 비운 자리가 여기다(칩 줄보다 얇아 목록은 오히려 늘었다).
            넘쳤을 때만 나타난다. ① 날짜 고르기의 안내와 짝이다: 거기서 '다음 화면에서 뺄 수
            있어요'로 끝나고, 뺄 수 있는 화면이 여기다. */}
        {overLimit && (
          <p className="shrink-0 px-5 pt-1.5 text-[13px] text-[#dc2626]">
            {maxPlaces}개까지 저장할 수 있어요. 줄을 눌러 빼주세요
          </p>
        )}

        {places.length === 0 ? (
          <p className="mt-4 px-5 text-[13px] text-[#60655c]">표시할 동선이 없어요</p>
        ) : (
          /*
            시트 안에서 굴러가는 목록.

            `overscroll-contain` 이 핵심이다 — 없으면 목록 끝에서 계속 밀 때 스크롤이 바깥으로
            넘어가 지도가 딸려 움직인다(iOS 는 페이지째 튕긴다). 목록에서 시작한 스크롤은
            목록에서 끝나야 한다.

            스크롤바는 숨긴다. 어디쯤인지는 잘린 반 줄이 알려주고, 데스크톱 스크롤바가
            초록 시트 오른쪽에 상시로 붙어 있으면 그것만 튄다.
          */
          <ul
            ref={listRef}
            // 가로 여백을 **목록이 아니라 줄이** 갖는다 — 목록이 패딩으로 밀어 두면 줄에
            // 깔린 배경색이 그 여백에 못 닿아 좌우가 흰 채로 남는다(띠가 잘려 보인다).
            className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {places.map((place, index) => {
              const disabled = disabledPlaceIds.has(place.id);

              // 필터에 안 걸리는 줄은 그리지 않는다(번호는 전체 기준으로 이미 매겨져 있다).
              if (dateFilter !== null && place.date !== dateFilter) return null;

              /*
                다음 줄로 이어지는 점선. **지도의 동선과 같은 규칙으로 끊는다**(설계서 5번):
                날짜가 바뀌면 끊고, 꺼진 장소는 건너뛴다. 그래서 목록에 난 빈틈이 "여기는
                동선이 안 지나간다"로 읽힌다 — 지도를 안 보고도 알 수 있다.
                색은 지도 폴리라인과 같은 BARK.
              */
              const next = places[index + 1];
              const linked =
                !disabled &&
                next !== undefined &&
                !disabledPlaceIds.has(next.id) &&
                next.date === place.date;

              return (
                // 짚어준 줄은 GREEN-300 띠를 깐다. 흰 바닥과 확실히 갈리면서, INK 글자가
                // 그 위에서 7.9:1 이라 읽는 데 지장이 없다. 사라질 때 부드럽게 빠지도록
                // `transition-colors` 를 걸어둔다 — 띠가 툭 없어지면 뭔가 고장 난 것처럼 보인다.
                //
                // 띠는 **시트 폭을 가로지른다.** 가로 여백(px-5)을 줄이 직접 가지므로 색이
                // 여백까지 덮는다. 그래서 모서리를 둥글리지 않는다 — 화면 끝에 닿는 띠라
                // 둥근 모서리가 걸칠 자리가 없다.
                <li
                  key={place.id}
                  data-place-id={place.id}
                  className={`relative px-5 transition-colors duration-500 ${
                    highlighted.has(place.id)
                      ? 'bg-pictree-300'
                      : place.id === focusedPlaceId
                        ? 'bg-pictree-100'
                        : ''
                  }`}
                >
                  {linked && (
                    <span
                      aria-hidden
                      // 사진(56px)의 세로 중심선 위에 놓는다: 줄 여백 20 + 사진 반폭 28 -
                      // 선 굵기 절반. 사진 아래(64)에서 다음 사진 위(80)까지 16px.
                      className="absolute left-[47px] top-16 h-4 border-l-2 border-dashed border-[#7a5c3a]/50"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onTogglePlace(place.id)}
                    aria-pressed={!disabled}
                    aria-label={`${place.name} 동선 ${disabled ? '켜기' : '끄기'}`}
                    className="flex w-full items-center gap-3 py-2 text-left"
                  >
                    <div
                      // 사진이 없을 때 드러나는 타일 바탕. 흰 바닥에선 흰 타일이 사라지므로
                      // 켜진 건 GREEN-100 로 채우고, 꺼진 건 **지도의 꺼진 마커와 같은 말**을
                      // 쓴다 — 흰 속에 회색 테두리만 남은 빈 틀.
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] transition-colors ${
                        disabled
                          ? 'border border-[#d9d9d9] bg-white'
                          : 'bg-pictree-100 shadow-[0_2px_6px_rgba(0,0,0,0.12)]'
                      }`}
                    >
                      {/* 꺼진 장소는 사진을 흑백으로 죽인다. 이름은 그대로 읽히게 두고(여전히
                          눌러서 되살릴 수 있는 버튼이다) 사진·번호·`제외됨` 으로만 구분한다 —
                          글자를 흐리게 하면 초록 배경 위에서 대비가 무너진다. */}
                      <Photo
                        src={place.imageUrl}
                        className={`h-full w-full object-cover ${disabled ? 'opacity-40 grayscale' : ''}`}
                        iconClassName="h-7 w-7"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-[#2c3930]">
                        {place.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-pictree-700">
                        {formatDateLabel(place.date)}
                      </p>
                    </div>

                    {/*
                      줄의 오른쪽 끝은 **이 장소가 동선의 몇 번째인지**를 말하는 자리다.
                      번호는 사진 위에 얹혀 있었는데, 사진의 왼쪽 위 모서리를 가려서 정작
                      어디였는지 알아보기 어려웠고 줄마다 위치가 사진에 묻혔다. 오른쪽에
                      세로로 줄을 맞추면 번호만 훑어 내려가며 순서를 읽을 수 있다.

                      꺼진 줄은 번호가 없다(남은 번호를 당겨 쓴다) — 그 자리에 `제외됨` 이
                      대신 들어간다. 둘이 같은 자리를 쓰므로 줄 높이가 흔들리지 않는다.

                      채움이 GREEN-500 이었다 — 흰 숫자가 3.6:1 이라 §1.2 의 '데코 전용'
                      규칙에 걸린다. 흰 글자를 얹는 초록은 GREEN-700 하나뿐(5.83:1).
                    */}
                    {disabled ? (
                      <span className="shrink-0 rounded-[8px] bg-pictree-100 px-2 py-1 text-[13px] font-medium text-pictree-700">
                        제외됨
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pictree-700 text-[13px] font-medium text-white">
                        {sequenceById.get(place.id)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/*
        시트 맨 아래에 붙박인 저장 버튼. **접히든 펴지든 자리가 안 바뀐다** — 접을 때 버튼이
        위아래로 뛰어다니면 어디를 누르려던 건지 놓친다. 가운데(필터·개수·목록)만 여닫히고
        이 줄은 그 아래에 그대로 있다.

        폭을 꽉 채운다. 이 화면에서 되돌릴 수 없는 유일한 동작이고, 목록을 다 고른 뒤 마지막에
        누르는 것이라 끝에 놓인 큰 버튼이 맞다. 엄지가 닿는 자리이기도 하다.

        끌기 영역이기도 하다 — 손잡이만으로는 잡을 데가 20px 남짓이라 좁다. 버튼 위에서
        시작한 세로 끌기도 시트를 여닫고, 그냥 누르면 저장된다(끌기로 판정되면 click 을 삼킨다).

        저장에 성공하면 동선 탭으로 넘어가므로 '저장됨' 같은 완료 상태가 필요 없다 —
        이 화면에 남아 있다는 건 아직 저장 전이라는 뜻이다.

        이름 짓기로 넘어가면 이 줄이 통째로 빠지고 저장은 네비바 오른쪽이 맡는다 — 그 단계에서
        시트는 '무엇을 저장할지'를 보여주고, 화면 머리가 '저장할지 말지'를 묻는다.
      */}
      {!nameField && onSave && (
        <div className="shrink-0 touch-none px-5 pt-3" {...drag.handlers}>
          <button
            type="button"
            onClick={() => {
              // 끌어서 시트를 여닫은 손짓이면 저장까지 하면 안 된다 — 끌기로 판정된 뒤에
              // 따라오는 click 을 삼킨다(손잡이 탭과 같은 처리).
              if (drag.consumeDrag()) return;
              onSave();
            }}
            /* 한도를 넘으면 잠근다 — 왜 잠겼는지는 바로 위 ERROR 줄이 이미 말하고 있다.
               ⚠️ 켠 장소가 0개인 경우는 여기서 잠그지 않는다. 그건 장소를 빼다 지나가는
               한때이지 잘못이 아니라, 시작하자마자 잠긴 버튼을 보여줄 이유가 없다 —
               그때는 눌렀을 때 토스트가 이유를 말한다(`RouteViewPage.handleSave`). */
            disabled={overLimit}
            className="h-12 w-full rounded-[12px] bg-[#2c3930] text-[15px] font-medium tracking-wide text-[#fffcef] disabled:bg-[#d9d9d9] disabled:text-[#60655c]"
          >
            동선저장
          </button>
        </div>
      )}
    </div>
  );
}
