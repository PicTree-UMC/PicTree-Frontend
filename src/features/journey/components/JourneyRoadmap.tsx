import { useLayoutEffect, useRef, useState } from 'react';

import { Journey } from '../types/journey';
import { useJourneyPhotos } from '../hooks/useJourneyPhotos';

/** 사진이 없는 노드를 채우는 플레이스홀더(사진 아이콘, tabler:photo 계열). */
function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9" r="1.3" />
      <path d="m3 17 5-4 4 3 3-2 6 5" />
    </svg>
  );
}

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
const MAX_W = 320; // 시안 기준 폭. 넓은 화면에서는 여기서 멈추고 가운데 정렬된다
const R = 28; // 노드 반지름(지름 56)
const TOP = R + 12; // 첫 노드 중심 y (순번 배지가 위로 삐져나오므로 여유)
const STEP = 118; // 노드 간 세로 간격
const INSET = 46; // 컨테이너 가장자리 ~ 노드 중심
const NODE_EDGE = INSET - R; // 가장자리 ~ 노드 상자 바깥면
const LABEL_EDGE = INSET + R + 12; // 가장자리 ~ 라벨 시작(노드 반대편)

interface JourneyRoadmapProps {
  journey: Journey;
}

/**
 * 선택된 동선의 장소 이동을 곡선 로드맵으로 그린다.
 * - 노드: 그 장소에서 찍은 사진을 원형 아이콘으로. 없으면 플레이스홀더.
 * - 간선: 노드 사이를 점선 곡선(SVG path)으로 연결.
 * - 라벨: 노드 바깥쪽에 장소명 + 순번.
 *
 * 사진은 목록 응답에 없어 동선별로 따로 받아온다(`GET /routes/{id}/images`).
 * 로드맵은 사진을 기다리지 않고 먼저 그리고, 도착하면 플레이스홀더가 사진으로 바뀐다 —
 * 장소·순서는 목록 응답만으로 알 수 있으므로 뼈대를 붙잡아 둘 이유가 없다.
 */
export function JourneyRoadmap({ journey }: JourneyRoadmapProps) {
  const { places } = journey;
  const { data: photos = [] } = useJourneyPhotos(journey.id);
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

  /**
   * 노드 썸네일. 사진 API 가 **장소당 한 장을 방문 순서로** 주므로 순번으로 짝지운다.
   *
   * 예전엔 장소명으로 찾았는데(목 시절), 실 데이터에서는 같은 이름의 장소가 여러 번
   * 나올 수 있어 첫 번째 사진이 뒤쪽 노드까지 따라붙는다. 순서는 서버가 보장한다.
   * 아직 안 도착했거나 사진이 없는 장소는 undefined → 플레이스홀더.
   */
  const photoFor = (index: number) => photos[index]?.url ?? undefined;

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
          stroke="#89986d"
          strokeWidth={2.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </svg>

      {nodes.map(({ place, index, y, isLeft }) => {
        const photoUrl = photoFor(index);
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
                <div className="relative size-full overflow-hidden rounded-full border-2 border-[#89986d] bg-[#ecf6d8]">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[#89986d]">
                      <PhotoPlaceholder className="size-7" />
                    </span>
                  )}
                </div>
                {/* 순번 배지 */}
                <span className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#5c6f2b] text-[10px] font-bold text-white">
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
                <p className="line-clamp-2 text-base font-bold text-[#111]">{place.name}</p>
                <p className="mt-0.5 text-xs font-medium text-[#8d8d8d]">
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
