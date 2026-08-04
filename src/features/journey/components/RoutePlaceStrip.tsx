import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { RoutePlace } from '../types/route';
import { formatDateLabel } from '../lib/formatDate';
import { RouteDateChips } from './RouteDateChips';

interface RoutePlaceStripProps {
  places: RoutePlace[];
  /** 사용자가 꺼둔 장소. 목록에는 남되 번호·개수·지도에서 빠진다(화면설계서 7번). */
  disabledPlaceIds: ReadonlySet<number>;
  /** 이 동선이 걸친 날짜. 칩 줄로 그려진다(화면설계서 6번). */
  dates: string[];
  /** 그날 장소가 전부 꺼져 있는 날짜. 칩은 남고 반투명해진다. */
  disabledDates: ReadonlySet<string>;
  onToggleDate: (dateKey: string) => void;
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
   * 지금 짚어줄 장소들. 지도에서 **겹쳐서 못 쪼개지는 묶음**을 탭했을 때 채워진다 —
   * 그 자리에선 더 확대해도 안 갈라지므로, 대신 목록에서 어느 장소들인지 보여준다.
   * 새 배열이 오면(같은 장소를 다시 탭해도) 시트가 펼쳐지고 첫 줄로 스크롤한다.
   */
  highlightedPlaceIds?: readonly number[];
}

/** 사진을 안 올린 장소. 홈 마커·`RoutePlacePreview` 와 같은 기본 아이콘을 쓴다. */
const FALLBACK_ICON = '/markers/tree.svg';

/**
 * 목록에 보이는 높이. 줄 하나가 72px(사진 56 + 위아래 8)이라 **2.5줄**이 걸치는 값이다.
 *
 * 반 줄을 일부러 남긴다 — 딱 떨어지게 자르면 목록이 거기서 끝난 것처럼 보여 아무도 안
 * 굴린다. 잘린 줄이 보이는 게 스크롤바보다 확실한 신호다(모바일 오버레이 스크롤바는
 * 손을 떼면 사라진다).
 */
const LIST_VIEWPORT_PX = 180;

/** 짚어준 줄 위에 남기는 여백. 위에 이전 줄이 살짝 걸쳐 보여야 목록 중간이라는 게 읽힌다. */
const HIGHLIGHT_SCROLL_MARGIN_PX = 12;

/** 손가락이 이만큼 세로로 움직이면 탭이 아니라 끌기로 본다. */
const DRAG_THRESHOLD_PX = 8;

/**
 * 손잡이·요약 줄을 잡고 위아래로 끌어 접고 펴는 조작. 카카오맵 하단 패널과 같은 감각이다.
 *
 * 끌기를 **손잡이·요약 줄에만** 붙인다 — 아래 장소 목록도 세로로 움직이는 영역이라, 거기서
 * 세로 제스처를 가로채면 목록을 굴리려는 손짓이 전부 시트 접기로 먹힌다.
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
 * 화면 하단의 동선 시트. **이 화면의 조작이 전부 여기 모여 있다** — 날짜 켜고 끄기,
 * 장소 켜고 끄기, 동선 저장. 지도 위에 남는 건 뒤로가기(와 저장된 동선의 제목)뿐이다.
 *
 * 세 층으로 읽힌다(카카오맵 하단 패널과 같은 순서): **요약 줄**(무엇을 보고 있는지 + 저장)
 * → **날짜 칩**(큰 단위로 걸러내기) → **장소 목록**(하나씩 다루기).
 *
 * **장소는 세로 목록이고 시트 안에서 스크롤한다.** 가로로 늘어놓던 시절엔 20곳이면 오른쪽
 * 끝까지 밀어야 했고, 화면 폭이 정한 칸에 이름을 욱여넣느라 사진과 날짜를 같이 못 보여줬다.
 * 세로로 세우면 한 줄이 화면 폭을 다 쓰므로 사진·이름·날짜가 한눈에 들어오고, 위아래 순서가
 * 곧 방문 순서라 번호와 두 번 말하는 셈이 된다.
 *
 * 위쪽 두 층(요약·날짜)은 **스크롤과 함께 밀려나지 않는다** — 목록을 굴리는 동안에도
 * `장소 n/20개`·`동선저장`·날짜 필터는 제자리에 있어야 한다.
 *
 * ⚠️ **사진은 ① 새 동선 만들기에만 온다** — 저장된 동선 상세(`GET /routes/{id}`)에는 없어서
 * ② 는 전부 기본 나무 아이콘이 된다. 서버가 사진을 실어주면 그대로 채워진다.
 *
 * 제목은 고른 날짜 수와 무관하게 '전체 동선' 하나다 — 날짜별 구분은 지도 쪽이 맡는다.
 * 새 동선을 만들 때만 장소 수를 n/20 으로 보여준다 — 저장 한도가 20개이기 때문(설계서 0·2번).
 *
 * 줄을 누르면 그 장소가 꺼지고 **뒤 번호가 당겨진다**(설계서 7번). 켠 장소만 세기 때문에
 * 화면에 보이는 번호는 항상 1부터 빈틈없이 이어진다.
 *
 * **접을 수 있다**(손잡이 탭 또는 끌기). 지도가 이 화면의 본체인데 시트가 아래를 계속 물고
 * 있으면 남쪽 마커가 가려진다. 접어도 `장소 n/20개`·`동선저장` 은 남긴다 — 접힌 상태가
 * 작업을 멈추는 게 아니라 지도를 넓게 보는 것뿐이어야 한다.
 */
export function RoutePlaceStrip({
  places,
  disabledPlaceIds,
  dates,
  disabledDates,
  onToggleDate,
  maxPlaces,
  onSave,
  onTogglePlace,
  highlightedPlaceIds,
}: RoutePlaceStripProps) {
  const activeCount = places.filter((place) => !disabledPlaceIds.has(place.id)).length;
  const [collapsed, setCollapsed] = useState(false);
  const drag = useCollapseDrag(setCollapsed);
  const listRef = useRef<HTMLUListElement>(null);
  const highlighted = new Set(highlightedPlaceIds ?? []);

  /*
    짚어줄 장소가 생기면 시트를 펼치고 그 줄까지 굴려서 보여준다.

    접혀 있으면 목록 자체가 안 보이므로 펴는 게 먼저다 — 접기는 사용자가 지도를 넓게
    보려고 한 선택이지만, 지도가 "여기선 더 못 보여준다"고 답한 참이라 시트가 이어받는다.

    ⚠️ `scrollIntoView` 를 쓰지 않는다 — 조상 스크롤 컨테이너까지 함께 움직일 수 있다.
    이 목록의 `scrollTop` 만 건드린다(`JourneyChips` 와 같은 이유).
    위치는 `offsetTop` 이 아니라 rect 차이로 잰다 — 줄(`li`)이 `relative` 라 `offsetParent`
    가 목록이 아니어서 `offsetTop` 이 엉뚱한 기준을 가리킨다.
  */
  useEffect(() => {
    if (!highlightedPlaceIds || highlightedPlaceIds.length === 0) return;

    setCollapsed(false);

    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-place-id="${highlightedPlaceIds[0]}"]`);
    if (!list || !row) return;

    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top: Math.max(top - HIGHLIGHT_SCROLL_MARGIN_PX, 0), behavior: 'smooth' });
  }, [highlightedPlaceIds]);

  // 번호는 켜진 장소에만 붙는다. map 안에서 증가시키므로 렌더 순서대로 1,2,3… 이 된다.
  let sequence = 0;

  return (
    /*
      바닥은 흰색이다 — 가이드라인이 '배경 · 카드/시트/탭바' 에 지정한 역할색(#FFFFFF).
      GREEN-300 연초록이었는데, 그것도 팔레트 안의 값(보조 면)이긴 하나 **패널의 색이지
      시트의 색이 아니다.** 바꾸면서 안쪽 요소도 같이 뒤집혔다: 크림으로 띄우던 것들
      (날짜 칩·손잡이·`제외됨`)은 흰 바닥에선 안 보이므로 각각 제 역할색을 찾아갔다.
    */
    <div className="rounded-t-[20px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
      {/* touch-none: 세로 끌기를 브라우저 기본 제스처에 뺏기지 않게. 손잡이 줄에만 건다. */}
      <div className="touch-none" {...drag.handlers}>
        <button
          type="button"
          onClick={() => {
            if (drag.consumeDrag()) return;
            setCollapsed((value) => !value);
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? '동선 목록 펼치기' : '동선 목록 접기'}
          className="flex w-full justify-center py-2"
        >
          {/* 손잡이는 흰 바닥에서 유일하게 '선'인 요소라 LINE 회색을 쓴다. 크림이었을 땐
              초록 바닥 위에서 밝게 떠 보였지만 흰 바닥에선 아예 사라진다. */}
          <span className="h-1 w-10 rounded-full bg-[#d9d9d9]" />
        </button>

        {/* 요약 줄은 **접어도 남는다** — 접기는 작업을 멈추는 게 아니라 지도를 넓게 보는 것이라,
            지금 몇 곳을 담았는지와 저장 버튼은 항상 손에 닿아야 한다. */}
        <div className="flex items-center gap-3 pb-1 pt-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-medium tracking-tight text-[#2c3930]">전체 동선</h2>
            {/* GREEN-500(#788f4a)이었다 — 연초록 바닥 위에서 **2.35:1** 로, 가이드라인이
                '연초록 패널 위 GREEN-500 텍스트는 결함'이라고 집어서 적어둔 바로 그 조합이다.
                보조 텍스트 자리이므로 INK-muted 로 간다(흰 위 5.98:1). */}
            <p className="mt-1 text-[13px] text-[#60655c]">
              장소 {maxPlaces === undefined ? activeCount : `${activeCount}/${maxPlaces}`}개
            </p>
          </div>

          {/* 저장에 성공하면 동선 탭으로 넘어가므로 '저장됨' 같은 완료 상태가 필요 없다 —
              이 화면에 남아 있다는 건 아직 저장 전이라는 뜻이다. */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="h-11 shrink-0 rounded-[10px] bg-[#2c3930] px-5 text-[15px] font-medium tracking-wide text-[#fffcef]"
            >
              동선저장
            </button>
          )}
        </div>
      </div>

      {/* 접히는 영역. 안쪽 목록이 제 높이(`LIST_VIEWPORT_PX`)로 잘려 있으므로 이 영역의 높이도
          날짜 칩 + 목록으로 고정이다 → 재지 않고 넉넉한 상한만 준다. max-height 는 상한일 뿐이라
          넉넉히 잡아도 펼친 높이가 커지지 않는다. `max-h-0` 로 접히므로 접힌 높이는 정확히 0. */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}
        // 접힌 동안 칩·목록이 보이지 않는데도 탭 순서·스크린리더에 남는 걸 막는다.
        // (`overflow:hidden` 은 시각만 자르지 초점은 그대로 들어간다.)
        inert={collapsed}
      >
        {/* 날짜 → 장소 순. 큰 단위로 먼저 걸러내고 남은 걸 하나씩 다루는 순서다.
            음수 마진: 칩 그림자가 좌우 스크롤 끝에서 잘리지 않게 패딩만큼 밖으로 뺐다가
            같은 값으로 되돌린다. 날짜가 없으면 `pt-4` 만 남아 빈 틈이 되므로 감싼 채로 뺀다. */}
        {dates.length > 0 && (
          <div className="-mx-5 px-5 pt-4">
            <RouteDateChips
              selectedDates={dates}
              disabledDates={disabledDates}
              onToggleDate={onToggleDate}
            />
          </div>
        )}

        {places.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#60655c]">표시할 동선이 없어요</p>
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
            className="-mx-5 mt-3 overflow-y-auto overscroll-contain px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: LIST_VIEWPORT_PX }}
          >
            {places.map((place, index) => {
              const disabled = disabledPlaceIds.has(place.id);
              if (!disabled) sequence += 1;

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
                <li
                  key={place.id}
                  data-place-id={place.id}
                  className={`relative transition-colors duration-500 ${
                    highlighted.has(place.id) ? 'rounded-[14px] bg-pictree-300' : ''
                  }`}
                >
                  {linked && (
                    <span
                      aria-hidden
                      // 사진(56px)의 세로 중심선 위에 놓는다: 왼쪽 28 - 선 굵기 절반.
                      // 사진 아래(64)에서 다음 사진 위(80)까지 16px.
                      className="absolute left-[27px] top-16 h-4 border-l-2 border-dashed border-[#7a5c3a]/50"
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
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt=""
                          className={`h-full w-full object-cover ${disabled ? 'opacity-40 grayscale' : ''}`}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <img
                            src={FALLBACK_ICON}
                            alt=""
                            className={`h-7 w-7 ${disabled ? 'opacity-40' : ''}`}
                          />
                        </span>
                      )}

                      {/* 꺼진 줄은 번호가 없다 — 남은 번호를 당겨 쓰기 때문에 붙일 번호가 없다.
                          빈 원을 남기지 않고 통째로 뺀다(사진을 덜 가린다). */}
                      {!disabled && (
                        // 채움이 GREEN-500 이었다 — 흰 숫자가 3.6:1 이라 §1.2 의 '데코 전용'
                        // 규칙에 걸린다. 흰 글자를 얹는 초록은 GREEN-700 하나뿐(5.83:1).
                        <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-pictree-700 text-[13px] font-medium text-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
                          {sequence}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-[#2c3930]">
                        {place.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#5b6b38]">
                        {formatDateLabel(place.date)}
                      </p>
                    </div>

                    {/* 흑백 사진만으로는 '꺼짐'이 안 읽힐 수 있어 글자로 한 번 더 말한다.
                        켜진 줄에는 아무것도 안 붙인다 — 기본 상태에 라벨을 붙이면 목록이 시끄럽다. */}
                    {disabled && (
                      <span className="shrink-0 rounded-[8px] bg-pictree-100 px-2 py-1 text-[13px] font-medium text-[#5b6b38]">
                        제외됨
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
