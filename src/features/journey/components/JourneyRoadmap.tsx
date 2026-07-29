import { Journey } from '../types/journey';

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
 * 곡선 로드맵의 좌표 상수. 노드를 좌우로 번갈아 놓고(leftX/rightX),
 * 세로로 STEP 간격으로 내려가며, 노드 사이를 부드러운 S자 곡선(점선)으로 잇는다.
 * 모든 좌표는 W 폭의 고정 좌표계 기준 — 컨테이너를 W 로 고정하고 가운데 정렬한다.
 */
const W = 320;
const R = 28; // 노드 반지름(지름 56)
const TOP = R + 12; // 첫 노드 중심 y (순번 배지가 위로 삐져나오므로 여유)
const STEP = 118; // 노드 간 세로 간격
const LEFT_X = 46;
const RIGHT_X = W - 46;

interface JourneyRoadmapProps {
  journey: Journey;
}

/**
 * 선택된 동선의 장소 이동을 곡선 로드맵으로 그린다.
 * - 노드: 그 장소에서 찍은 사진(placeName 매칭)을 원형 아이콘으로. 없으면 플레이스홀더.
 * - 간선: 노드 사이를 점선 곡선(SVG path)으로 연결.
 * - 라벨: 노드 바깥쪽에 장소명 + 순번.
 */
export function JourneyRoadmap({ journey }: JourneyRoadmapProps) {
  const { places, photos } = journey;

  /** 장소명이 일치하고 url 이 있는 사진을 노드 썸네일로 쓴다. */
  const photoFor = (placeName: string) =>
    photos.find((photo) => photo.placeName === placeName && photo.url)?.url;

  const nodes = places.map((place, index) => ({
    place,
    index,
    x: index % 2 === 0 ? LEFT_X : RIGHT_X,
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
    <ol className="relative mx-auto" style={{ width: W, height }}>
      <svg
        width={W}
        height={height}
        viewBox={`0 0 ${W} ${height}`}
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

      {nodes.map(({ place, index, x, y, isLeft }) => {
        const photoUrl = photoFor(place.name);
        const labelStyle = isLeft
          ? { left: x + R + 12, textAlign: 'left' as const }
          : { right: W - (x - R - 12), textAlign: 'right' as const };
        // 노드가 먼저 튀어오르고 라벨이 살짝 뒤따르도록 순번대로 지연을 준다.
        // 위치 지정 transform 과 겹치지 않게 애니메이션은 안쪽 래퍼에만 건다.
        const nodeDelay = `${index * 90}ms`;
        const labelDelay = `${index * 90 + 40}ms`;
        return (
          <li key={place.id} className="contents">
            {/* 노드 */}
            <div
              className="absolute size-14 -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
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
