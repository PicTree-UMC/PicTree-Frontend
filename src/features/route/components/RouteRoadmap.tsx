import { useLayoutEffect, useRef, useState } from 'react';

import { Photo } from '@/shared/components';
import { Route } from '../types/route';
import { useRoutePhotos } from '../hooks/useRoutePhotos';

/**
 * 곡선 로드맵의 좌표 상수. 노드를 좌우로 번갈아 놓고, 세로로 STEP 간격으로 내려가며,
 * 노드 사이를 부드러운 S자 곡선(점선)으로 잇는다.
 *
 * ⚠️ 되돌리지 말 것 — 예전엔 `const W = 320` 고정 폭 좌표계였다. 페이지가 `px-5` 를 주므로
 * 뷰포트 360px 미만에서 컨테이너(280px)보다 ol 이 넓어져 오른쪽 노드(2·4번)가 통째로
 * 잘려 나갔다(점검 폭 320 에서 재현). 가로는 유동이어야 한다.
 *  - 세로(TOP/STEP)와 노드 크기(R)는 고정 px 로 둔다. 규칙상 세로는 고정이 허용된다.
 *  - 가로는 "가장자리에서 INSET 만큼"이라는 관계로만 표현한다. 노드·라벨은 CSS
 *    left/right 로 붙이므로 폭을 몰라도 된다.
 *  - 폭을 알아야 하는 건 SVG path 하나뿐이라 거기만 실제 폭을 측정해 쓴다.
 *    (viewBox 를 늘려 스케일하면 점선 dash 와 stroke 가 가로로만 찌그러진다)
 */
/*
  ⚠️ **로딩 자리(`RouteRoadmapLoader`)가 이 값들을 그대로 쓴다** — 그래서 export 다.
  "동선이 깔리는" 연출이 실제 노드가 앉을 자리에 정확히 그려져야 해서, 상수를 따로 들면
  로딩에서 본 곡선과 실제 곡선이 미묘하게 어긋난다. (§ '각자 상수를 들지 말 것')
*/
export const MAX_W = 320; // 시안 기준 폭. 넓은 화면에서는 여기서 멈추고 가운데 정렬된다
export const R = 28; // 노드 반지름(지름 56)
export const TOP = R + 12; // 첫 노드 중심 y (순번 배지가 위로 삐져나오므로 여유)
export const STEP = 118; // 노드 간 세로 간격
export const INSET = 46; // 컨테이너 가장자리 ~ 노드 중심
export const NODE_EDGE = INSET - R; // 가장자리 ~ 노드 상자 바깥면
const LABEL_EDGE = INSET + R + 12; // 가장자리 ~ 라벨 시작(노드 반대편)

/** 로드맵이 노드 하나를 그리는 데 필요한 전부. 저장 전/후 어느 쪽에서 왔는지는 모른다. */
export interface RoadmapPlace {
  name: string;
  /** 노드에 넣을 사진. 없거나 아직 안 왔으면 나무 폴백. */
  photoUrl?: string | null;
}

interface RouteRoadmapProps {
  places: RoadmapPlace[];
}

/**
 * 동선의 장소 이동을 곡선 로드맵으로 그린다.
 * - 노드: 그 장소에서 찍은 사진을 원형 아이콘으로. 없거나 못 불러오면 나무 폴백.
 * - 간선: 노드 사이를 점선 곡선(SVG path)으로 연결.
 * - 라벨: 노드 바깥쪽에 장소명 + 순번.
 *
 * **사진을 자기가 받아오지 않는다.** 저장된 동선(`GET /routes/{id}/images`)과 저장 전 미리보기
 * (후보 목록에 실려 오는 `imageUrl`)가 사진을 다른 데서 얻기 때문이다. 저장 화면이 목록에서
 * 볼 그림을 **똑같이** 보여주려면 이 컴포넌트가 출처를 몰라야 한다.
 * 저장된 동선 쪽은 아래 `SavedRouteRoadmap` 이 감싼다.
 */
export function RouteRoadmap({ places }: RouteRoadmapProps) {
  const listRef = useRef<HTMLOListElement>(null);
  // path 를 그리려면 실제 폭이 필요하다. useLayoutEffect 라 첫 페인트 전에 보정돼 깜빡임이 없다.
  const [width, setWidth] = useState(MAX_W);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // 초기값은 동기로 읽는다. ResizeObserver 의 첫 콜백에만 의존하면 콜백이 밀리는 상황
    // (배경 탭 등)에서 좁은 화면인데도 MAX_W 인 채로 첫 페인트가 나간다.
    setWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const nodes = places.map((place, index) => ({
    place,
    index,
    x: index % 2 === 0 ? INSET : width - INSET,
    y: TOP + index * STEP,
    isLeft: index % 2 === 0,
  }));

  const height = TOP + (Math.max(places.length, 1) - 1) * STEP + R + 24;

  // 연속한 노드를 잇는 S자 곡선 경로. 제어점을 세로로 밀어 완만한 굴곡을 만든다.
  const path = nodes.reduce((acc, node, index) => {
    if (index === 0) return `M ${node.x} ${node.y}`;
    const prev = nodes[index - 1];
    const cp1y = prev.y + STEP * 0.55;
    const cp2y = node.y - STEP * 0.55;
    return `${acc} C ${prev.x} ${cp1y}, ${node.x} ${cp2y}, ${node.x} ${node.y}`;
  }, '');

  return (
    <ol ref={listRef} className="relative mx-auto w-full max-w-[320px]" style={{ height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="animate-fade-in pointer-events-none absolute inset-0"
        aria-hidden
      >
        <path
          d={path}
          fill="none"
          stroke="#788f4a"
          strokeWidth={2.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </svg>

      {nodes.map(({ place, index, y, isLeft }) => {
        // 노드·라벨은 가까운 쪽 가장자리에 붙인다 — 폭을 몰라도 되고, 컨테이너가 좁아져도
        // 반대쪽으로 밀려나 잘리지 않는다.
        const nodeStyle = isLeft ? { left: NODE_EDGE } : { right: NODE_EDGE };
        const labelStyle = isLeft
          ? { left: LABEL_EDGE, textAlign: 'left' as const }
          : { right: LABEL_EDGE, textAlign: 'right' as const };
        // 노드가 먼저 튀어오르고 라벨이 살짝 뒤따르도록 순번대로 지연을 준다.
        // 위치 지정 transform 과 겹치지 않게 애니메이션은 안쪽 래퍼에만 건다.
        const nodeDelay = `${index * 90}ms`;
        const labelDelay = `${index * 90 + 40}ms`;
        // key 는 index 를 쓴다 — 서버가 장소 식별자를 주지 않고(이름·기분뿐) 순서가 곧 동선이다.
        return (
          <li key={index} className="contents">
            {/* 노드 */}
            <div className="absolute size-14 -translate-y-1/2" style={{ ...nodeStyle, top: y }}>
              <div
                className="animate-roadmap-pop relative size-full"
                style={{ animationDelay: nodeDelay }}
              >
                <div className="relative size-full overflow-hidden rounded-full border-2 border-pictree-500 bg-pictree-100">
                  <Photo
                    src={place.photoUrl}
                    className="size-full object-cover"
                    iconClassName="size-7"
                  />
                </div>
                {/* 순번 배지 */}
                <span className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-pictree-700 text-[13px] font-medium text-white">
                  {index + 1}
                </span>
              </div>
            </div>

            {/* 라벨 */}
            <div
              className="absolute w-[120px] -translate-y-1/2"
              style={{ top: y, ...labelStyle }}
            >
              <div className="animate-roadmap-pop" style={{ animationDelay: labelDelay }}>
                <p className="line-clamp-2 text-base font-medium text-ink">{place.name}</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink-muted">
                  {index + 1}번째 장소
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 저장된 동선용 로드맵 — 사진만 받아다 위 컴포넌트에 넘긴다.
 *
 * 사진은 목록 응답에 없어 동선별로 따로 받아온다(`GET /routes/{id}/images`).
 * 로드맵은 사진을 기다리지 않고 먼저 그리고, 도착하면 플레이스홀더가 사진으로 바뀐다 —
 * 장소·순서는 목록 응답만으로 알 수 있으므로 뼈대를 붙잡아 둘 이유가 없다.
 *
 * 사진 API 가 **장소당 한 장을 방문 순서로** 주므로 순번으로 짝지운다. 예전엔 장소명으로
 * 찾았는데(목 시절), 실 데이터에서는 같은 이름의 장소가 여러 번 나올 수 있어 첫 번째 사진이
 * 뒤쪽 노드까지 따라붙는다. 순서는 서버가 보장한다.
 */
export function SavedRouteRoadmap({ route }: { route: Route }) {
  const { data: photos = [] } = useRoutePhotos(route.id);

  const places = route.places.map((place, index) => ({
    name: place.name,
    photoUrl: photos[index]?.url,
  }));

  return <RouteRoadmap places={places} />;
}
