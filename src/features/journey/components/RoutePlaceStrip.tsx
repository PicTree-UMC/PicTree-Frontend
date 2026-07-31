import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { RoutePlace } from '../types/route';

interface RoutePlaceStripProps {
  places: RoutePlace[];
  /** 사용자가 꺼둔 장소. 목록에는 남되 번호·개수·지도에서 빠진다(화면설계서 7번). */
  disabledPlaceIds: ReadonlySet<number>;
  /**
   * 저장 한도. **저장된 동선을 볼 때는 넘기지 않는다** — 이미 저장된 것이라 한도가 의미 없고,
   * `3/20개` 처럼 보이면 더 담을 수 있다는 오해를 준다. 없으면 `장소 n개` 로만 쓴다.
   */
  maxPlaces?: number;
  onTogglePlace: (placeId: number) => void;
}

/** 칩 사이 구분자(디자인 ooui:next-ltr). */
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * 시안 하단의 얇은 가로 스크롤 인디케이터. 네이티브 스크롤바는 숨기고 이걸 대신 그린다
 * (모바일에선 오버레이 스크롤바가 손을 떼면 사라져서, 옆에 더 있다는 신호가 남지 않는다).
 *
 * ⚠️ 초기값을 ResizeObserver 첫 콜백에 맡기면 콜백이 밀리는 환경에서 첫 페인트가
 * 기본값인 채로 나간다 → `useLayoutEffect` 에서 한 번 동기로 읽는다(TROUBLESHOOTING 참조).
 */
function useScrollIndicator(contentKey: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ size: 1, offset: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || el.scrollWidth === 0) return;
    const size = el.clientWidth / el.scrollWidth;
    const offset = el.scrollLeft / el.scrollWidth;
    setBar((prev) => (prev.size === size && prev.offset === offset ? prev : { size, offset }));
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    measure();

    // 컨테이너 폭(회전·창 크기)과 내용 폭(장소 추가/제거)이 따로 변하므로 둘 다 관찰한다.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener('scroll', measure, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [measure, contentKey]);

  return { ref, ...bar };
}

/**
 * 화면 하단의 동선 요약 바.
 *
 * 제목은 고른 날짜 수와 무관하게 '전체 동선' 하나다 — 날짜별 구분은 지도 쪽이 맡는다.
 * 새 동선을 만들 때만 장소 수를 n/20 으로 보여준다 — 저장 한도가 20개이기 때문(설계서 0·2번).
 *
 * 칩을 누르면 그 장소가 꺼지고 **뒤 번호가 당겨진다**(설계서 7번). 켠 장소만 세기 때문에
 * 화면에 보이는 번호는 항상 1부터 빈틈없이 이어진다.
 */
export function RoutePlaceStrip({
  places,
  disabledPlaceIds,
  maxPlaces,
  onTogglePlace,
}: RoutePlaceStripProps) {
  const activeCount = places.filter((place) => !disabledPlaceIds.has(place.id)).length;
  const scroller = useScrollIndicator(places);

  // 번호는 켜진 장소에만 붙는다. map 안에서 증가시키므로 렌더 순서대로 1,2,3… 이 된다.
  let sequence = 0;

  return (
    <div className="bg-[#c5d89d] px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
      <h2 className="text-[15px] font-medium tracking-tight text-[#2c3930]">전체 동선</h2>
      <p className="mt-1 text-[13px] text-[#89986d]">
        장소 {maxPlaces === undefined ? activeCount : `${activeCount}/${maxPlaces}`}개
      </p>

      {places.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#89986d]">표시할 동선이 없어요</p>
      ) : (
        <>
          <div
            ref={scroller.ref}
            className="mt-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max items-center gap-1.5">
              {places.map((place, index) => {
                const disabled = disabledPlaceIds.has(place.id);
                if (!disabled) sequence += 1;

                return (
                  <Fragment key={place.id}>
                    {index > 0 && <ChevronRight className="h-5 w-3 shrink-0 text-[#2c3930]" />}
                    <button
                      type="button"
                      onClick={() => onTogglePlace(place.id)}
                      aria-pressed={!disabled}
                      aria-label={`${place.name} 동선 ${disabled ? '켜기' : '끄기'}`}
                      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] py-1.5 pl-1.5 pr-3 transition-colors ${
                        disabled
                          ? 'bg-[#fffcef]/45 text-[#89986d]'
                          : 'bg-[#fffdf7] text-[#111] shadow-[0_2px_6px_rgba(0,0,0,0.12)]'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                          disabled ? 'bg-[#9cab84]/40 text-[#fffcef]' : 'bg-[#89986d] text-white'
                        }`}
                      >
                        {/* 꺼진 칩은 번호가 없다 — 남은 번호를 당겨 쓰기 때문에 붙일 번호가 없다. */}
                        {disabled ? '' : sequence}
                      </span>
                      <span className="max-w-[110px] truncate text-[13px] font-medium">
                        {place.name}
                      </span>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#fffcef]">
            <div
              className="h-full rounded-full bg-[#9cab84]"
              style={{
                // 손잡이가 너무 얇아지면 잡히지 않아 최소 폭을 준다.
                width: `${Math.max(scroller.size, 0.12) * 100}%`,
                marginLeft: `${scroller.offset * 100}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
