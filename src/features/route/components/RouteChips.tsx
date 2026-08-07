import { useEffect, useRef } from 'react';
import { Chip } from '@/shared/components';
import { Route } from '../types/route';

/** 새 동선 만들기 칩의 + 아이콘. */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface RouteChipsProps {
  routes: Route[];
  selectedId: number | null;
  onSelect: (route: Route) => void;
  /** 새 동선 만들기(`/journey/view`). 칩 줄 맨 왼쪽의 + 버튼이 부른다. */
  onCreate: () => void;
}

/** 선택된 칩이 스크롤 밖으로 나갔을 때 남기는 여백. */
const SCROLL_MARGIN = 16;

/**
 * 저장된 동선을 가로 스크롤 칩으로 나열하는 셀렉터.
 * 선택된 칩만 세이지로 채워지고, 나머지는 아웃라인으로 둔다.
 * 스크롤바는 숨겨 칩 줄만 깔끔하게 보이게 한다.
 *
 * 동선이 많아지면 선택된 칩이 화면 밖에 있을 수 있어 가로로 끌어온다 — 저장 직후처럼
 * 사용자가 직접 누르지 않고 선택이 바뀌는 경우에 필요하다(안 하면 아무것도 안 고른 것처럼 보인다).
 *
 * ⚠️ `scrollIntoView` 를 쓰지 않는다 — 조상 스크롤 컨테이너까지 세로로 움직일 수 있다.
 * 이 컨테이너의 `scrollLeft` 만 건드린다.
 *
 * 맨 왼쪽 + 칩은 **스크롤 밖에 고정한다.** 동선이 많아지면 스크롤에 딸려 사라지는데,
 * 이건 새 동선을 만드는 유일한 입구라 항상 닿을 수 있어야 한다. 위의 자동 스크롤도
 * 한몫한다 — 저장 직후처럼 사용자가 누르지 않았는데 선택이 바뀌면 줄이 저절로 밀린다.
 */
export function RouteChips({ routes, selectedId, onSelect, onCreate }: RouteChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = selectedRef.current;
    if (!scroller || !chip) return;

    const chipRight = chip.offsetLeft + chip.offsetWidth;
    const viewRight = scroller.scrollLeft + scroller.clientWidth;

    // 이미 보이는 칩이면 아무것도 하지 않는다 — 누를 때마다 줄이 흔들리면 안 된다.
    if (chip.offsetLeft < scroller.scrollLeft) {
      scroller.scrollTo({ left: chip.offsetLeft - SCROLL_MARGIN, behavior: 'smooth' });
    } else if (chipRight > viewRight) {
      scroller.scrollTo({
        left: chipRight - scroller.clientWidth + SCROLL_MARGIN,
        behavior: 'smooth',
      });
    }
  }, [selectedId]);

  return (
    <div className="flex items-start gap-2">
      {/* 점선 테두리 — 옆의 동선 칩들과 달리 '고르는 것'이 아니라 '만드는 것'이라
          한눈에 갈리게 한다. 그래서 `Chip` 이 아니고 `aria-pressed` 도 없다(토글이 아니다).
          높이만 칩(h-10)에 맞춰 한 줄로 떨어지게 한다. */}
      <button
        type="button"
        onClick={onCreate}
        aria-label="새 동선 만들기"
        className="flex h-10 shrink-0 items-center rounded-full border border-dashed border-pictree-500 px-3 text-pictree-500"
      >
        <PlusIcon className="size-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {routes.map((route) => {
          const isSelected = route.id === selectedId;
          return (
            <Chip
              key={route.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onSelect(route)}
              selected={isSelected}
            >
              {route.title}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
