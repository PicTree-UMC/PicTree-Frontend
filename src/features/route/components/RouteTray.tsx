import { useEffect, useRef, type Ref } from 'react';

import { Photo } from '@/shared/components';
import { Route } from '../types/route';
import { useRoutePhotos } from '../hooks/useRoutePhotos';

/** 새 동선 만들기 칸의 + 아이콘. */
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

/**
 * 한 칸의 자리 크기.
 *
 * ⚠️ 링은 `ring-*` 유틸이라 **레이아웃을 차지하지 않는다** — 원(56px)만 자리를 잡으면
 * 링과 틈(2+3px)이 이웃 칸 위로 삐져나와 간격이 좁아 보인다. 그래서 원을 감싸는 상자를
 * 링 바깥까지 포함한 크기로 따로 잡는다. 56 + 2×(틈 3 + 링 2) = 66.
 */
const RING_BOX = 'size-[66px]';
/** 칸 폭. 링 상자(66)보다 조금 넓게 잡아 아래 라벨이 한 글자라도 더 들어간다. */
const ITEM_W = 'w-[72px]';

/** 선택된 칩이 스크롤 밖으로 나갔을 때 남기는 여백. */
const SCROLL_MARGIN = 16;

interface RouteTrayItemProps {
  route: Route;
  selected: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * 트레이 한 칸 — 동선 아이콘(원) + 아래 이름.
 *
 * **사진을 칸마다 따로 받는다**(`GET /routes/{id}/images`). 목록 응답(`GET /routes`)에는
 * 사진이 없고 이름·기분뿐이라 달리 얻을 데가 없다. 요청이 동선 수만큼 나가지만 **새로 생기는
 * 비용이 아니다** — 로드맵(`SavedRouteRoadmap`)이 같은 훅·같은 캐시 키를 쓰므로, 동선을 하나씩
 * 눌러 보면 어차피 나갈 요청을 앞당겨 데워 두는 것이다. 덕분에 칸을 누른 뒤 로드맵 사진이
 * 이미 캐시에 있다.
 */
function RouteTrayItem({ route, selected, onClick, ref }: RouteTrayItemProps) {
  const { data: photos = [] } = useRoutePhotos(route.id);

  /*
    사진을 안 올린 장소는 `url` 이 null 로 온다. 첫 장소가 그런 경우 `photos[0]` 을 그대로
    쓰면 사진이 있는 동선인데도 나무로 떨어진다 — 이 줄의 목적이 "어느 여행인지 사진으로
    알아보기" 라 **있는 사진 중 첫 장**을 세운다.
  */
  const photoUrl = photos.find((photo) => photo.url)?.url ?? null;

  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex ${ITEM_W} shrink-0 flex-col items-center gap-2`}
    >
      <span className={`flex ${RING_BOX} items-center justify-center`}>
        {/*
          링 색이 선택 상태다 — 안 고르면 회색(`ink-disabled`), 고르면 브랜드 초록(GREEN-700).
          두 값의 밝기가 L* 74 vs 43 으로 벌어져 있어 색을 못 가려도 링이 진해진 것으로 읽힌다.
          그 위에 아래 라벨의 굵기까지 같이 바뀌므로 상태를 색 하나가 나르지 않는다.

          ⚠️ 라벨을 흐리게 하지는 않는다 — 안 골랐어도 눌러서 고르는 버튼이라 읽혀야 한다
          (`Chip` 과 같은 규칙). 차이는 링과 굵기로만 낸다.

          `ring-offset-cream` 의 틈은 바닥색과 같은 값이라 링과 사진 사이가 비어 보인다.
          이 트레이는 크림 페이지 위에만 있다.
        */}
        <Photo
          src={photoUrl}
          className={`size-14 rounded-full bg-pictree-100 object-cover ring-2 ring-offset-[3px] ring-offset-cream ${
            selected ? 'ring-pictree-700' : 'ring-ink-disabled'
          }`}
          iconClassName="size-7"
        />
      </span>
      <span
        className={`w-full truncate text-center text-[13px] text-ink ${
          selected ? 'font-medium' : ''
        }`}
      >
        {route.title}
      </span>
    </button>
  );
}

interface RouteTrayProps {
  routes: Route[];
  selectedId: number | null;
  onSelect: (route: Route) => void;
  /** 새 동선 만들기(`/journey/create`). 줄 맨 왼쪽 칸이 부른다. */
  onCreate: () => void;
}

/**
 * 저장된 동선을 인스타그램 스토리 줄 꼴로 나열하는 셀렉터 — 사진이 든 원 + 아래 이름.
 *
 * 예전에는 이름만 든 알약 칩이었다. 동선 이름은 대부분 사용자가 급히 붙인 짧은 말이라
 * **줄을 훑어도 어느 여행이었는지 되살아나지 않았다.** 첫 장소 사진을 세우면 이름을 읽기
 * 전에 알아본다.
 *
 * 동선이 많아지면 선택된 칸이 화면 밖에 있을 수 있어 가로로 끌어온다 — 저장 직후처럼
 * 사용자가 직접 누르지 않고 선택이 바뀌는 경우에 필요하다(안 하면 아무것도 안 고른 것처럼 보인다).
 *
 * ⚠️ `scrollIntoView` 를 쓰지 않는다 — 조상 스크롤 컨테이너까지 세로로 움직일 수 있다.
 * 이 컨테이너의 `scrollLeft` 만 건드린다.
 *
 * `새 동선` 칸은 **줄의 첫 칸이고 나머지와 같이 미끄러진다**(인스타그램의 `내 스토리` 와
 * 같은 자리). 한동안 스크롤 **밖**에 고정돼 있었다 — 새 동선을 만드는 유일한 입구라
 * 동선이 늘어도 닿아야 한다는 이유였고, 저장 직후의 자동 스크롤에 딸려 나가지 않게 하려는
 * 뜻도 있었다.
 *
 * **되돌린 이유: 고정이 화면에서 고정으로 안 읽혔다.** 다른 칸과 크기·모양이 같은 것이
 * 혼자 안 움직이니 눌러붙은 것처럼 보였고, 한 줄로 보이는 것이 실제로는 **따로 노는 두 구역**
 * 이었다. 경계선을 그어 그 사실을 알려주는 길도 있었지만(그것도 한 번 해봤다), 그건 어긋남을
 * 설명하는 것이지 없애는 것이 아니다. 같이 밀리면 설명할 것이 남지 않는다.
 *
 * ⚠️ **대신 `+` 가 왼쪽으로 밀려 화면 밖으로 나갈 수 있다.** 되돌아오려면 줄을 오른쪽으로
 * 밀면 되고(스토리 줄에서 늘 하는 손짓이다), 자동 스크롤이 그리 미는 경우는 **방금 동선을
 * 저장하고 온 참**이라 곧바로 또 만들 일이 드물다. 그래도 만들 길이 화면에서 사라진다는
 * 사실은 남으므로, 이게 걸리면 `+` 를 트레이 밖(헤더 등)으로 옮기는 쪽이 다음 수다.
 */
export function RouteTray({ routes, selectedId, onSelect, onCreate }: RouteTrayProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const item = selectedRef.current;
    if (!scroller || !item) return;

    /*
      자리는 **rect 차이로 잰다**(`offsetLeft` 가 아니라). `offsetLeft` 는 가장 가까운
      **위치 지정 조상** 기준인데 이 스크롤러는 `relative` 가 아니라서, 값에 페이지 여백과
      가운데 정렬 여백까지 섞여 들어온다. 아래 비교는 스크롤러 안쪽 좌표를 전제로 하므로
      그만큼 어긋난다 — 칸이 하나(`새 동선`) 앞에 붙으면서 그 어긋남이 80px 더 커졌다.
      (`RoutePlaceStrip.scrollToPlace` 가 세로로 같은 처리를 한다.)
    */
    const left =
      item.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    const right = left + item.offsetWidth;
    const viewRight = scroller.scrollLeft + scroller.clientWidth;

    // 이미 보이는 칸이면 아무것도 하지 않는다 — 누를 때마다 줄이 흔들리면 안 된다.
    if (left < scroller.scrollLeft) {
      scroller.scrollTo({ left: Math.max(left - SCROLL_MARGIN, 0), behavior: 'smooth' });
    } else if (right > viewRight) {
      scroller.scrollTo({
        left: right - scroller.clientWidth + SCROLL_MARGIN,
        behavior: 'smooth',
      });
    }
  }, [selectedId]);

  return (
    /*
      한 줄이 통째로 미끄러진다 — `새 동선` 도 그 안에 있다.

      페이지의 `px-5` 를 상쇄해 양 끝까지 흘려보내고, 여백은 스크롤러가 padding 으로 되돌려
      갖는다: 왼쪽 `pl-5` 로 다른 줄들과 시작점을 맞추고, 오른쪽 `pr-5` 는 끝까지 밀었을 때
      마지막 칸이 화면 끝에 붙지 않게 한다. 줄이 가장자리에서 잘려 보이는 것이 곧
      "옆에 더 있다" 다.
    */
    <div
      ref={scrollerRef}
      className="-mx-5 flex items-start gap-2 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 점선 테두리 — 옆의 동선 칸들과 달리 '고르는 것'이 아니라 '만드는 것'이라
          한눈에 갈리게 한다. 그래서 링(선택 상태)이 없고 `aria-pressed` 도 없다. */}
      <button
        type="button"
        onClick={onCreate}
        className={`flex ${ITEM_W} shrink-0 flex-col items-center gap-2`}
      >
        <span className={`flex ${RING_BOX} items-center justify-center`}>
          <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-pictree-500 text-pictree-500">
            <PlusIcon className="size-6" />
          </span>
        </span>
        <span className="w-full truncate text-center text-[13px] text-ink">새 동선</span>
      </button>

      {routes.map((route) => (
        <RouteTrayItem
          key={route.id}
          ref={route.id === selectedId ? selectedRef : undefined}
          route={route}
          selected={route.id === selectedId}
          onClick={() => onSelect(route)}
        />
      ))}
    </div>
  );
}
