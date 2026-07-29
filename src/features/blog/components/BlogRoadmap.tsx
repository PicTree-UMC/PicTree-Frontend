import type { BlogTreeRecord } from '../types/blog';

/** 사진이 없는 노드를 채우는 플레이스홀더(사진 아이콘). */
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

/** 선택된 노드의 상태 배지에 들어가는 체크 아이콘. */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 13 4 4 10-11" />
    </svg>
  );
}

/**
 * 곡선 로드맵의 좌표 상수. 노드를 좌우로 번갈아 놓고(LEFT_X/RIGHT_X),
 * 세로로 STEP 간격으로 내려가며, 노드 사이를 부드러운 S자 곡선(점선)으로 잇는다.
 * 모든 좌표는 W 폭의 고정 좌표계 기준 — 컨테이너를 W 로 고정하고 가운데 정렬한다.
 */
const W = 320;
const R = 28; // 노드 반지름(지름 56)
const TOP = R + 12; // 첫 노드 중심 y (상태 배지가 위로 삐져나오므로 여유)
const STEP = 118; // 노드 간 세로 간격
const LEFT_X = 46;
const RIGHT_X = W - 46;

interface BlogRoadmapProps {
  trees: BlogTreeRecord[];
  /** 초안에 포함할 기록(treeId) 집합. 기본은 전체 선택. */
  selectedIds: number[];
  /** 노드 클릭 시 해당 기록의 선택/해제를 토글한다. */
  onToggle: (treeId: number) => void;
}

/**
 * 선택한 기간의 기록(나무)을 곡선 로드맵으로 그린다.
 * - 노드: 기록 사진(defaultImage)을 원형 썸네일로. 없으면 플레이스홀더. 클릭으로 선택/해제.
 * - 간선: 노드 사이를 점선 곡선(SVG path)으로 연결.
 * - 라벨: 노드 바깥쪽에 장소명.
 * - 선택 상태: 컬러 + 체크 배지 / 해제 상태: 흑백 + 빈 배지로 구분한다.
 */
export function BlogRoadmap({ trees, selectedIds, onToggle }: BlogRoadmapProps) {
  const nodes = trees.map((tree, index) => ({
    tree,
    index,
    x: index % 2 === 0 ? LEFT_X : RIGHT_X,
    y: TOP + index * STEP,
    isLeft: index % 2 === 0,
  }));

  const height = TOP + (Math.max(trees.length, 1) - 1) * STEP + R + 24;

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
          stroke="#7f9648"
          strokeWidth={2.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
      </svg>

      {nodes.map(({ tree, index, x, y, isLeft }) => {
        const selected = selectedIds.includes(tree.treeId);
        const labelStyle = isLeft
          ? { left: x + R + 12, textAlign: 'left' as const }
          : { right: W - (x - R - 12), textAlign: 'right' as const };
        // 노드가 먼저 튀어오르고 라벨이 살짝 뒤따르도록 순번대로 지연을 준다.
        // 위치 지정 transform 과 겹치지 않게 애니메이션은 안쪽 래퍼에만 건다.
        const nodeDelay = `${index * 90}ms`;
        const labelDelay = `${index * 90 + 40}ms`;
        return (
          <li key={tree.treeId} className="contents">
            {/* 노드 (선택 토글 버튼) */}
            <button
              type="button"
              onClick={() => onToggle(tree.treeId)}
              aria-pressed={selected}
              aria-label={`${tree.name} ${selected ? '선택됨, 눌러서 해제' : '해제됨, 눌러서 선택'}`}
              className="absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: x, top: y }}
            >
              <span
                className="animate-roadmap-pop relative block size-full"
                style={{ animationDelay: nodeDelay }}
              >
                <span
                  className={`relative block size-full overflow-hidden rounded-full border-2 transition ${
                    selected ? 'border-[#7f9648] bg-[#e9ffbb]' : 'border-[#d4d4d4] bg-[#f0f0f0]'
                  }`}
                >
                  {tree.defaultImage ? (
                    <img
                      src={tree.defaultImage}
                      alt=""
                      className={`size-full object-cover transition ${
                        selected ? '' : 'grayscale opacity-45'
                      }`}
                    />
                  ) : (
                    <span
                      className={`flex size-full items-center justify-center ${
                        selected ? 'text-[#7f9648]' : 'text-[#b4b4b4]'
                      }`}
                    >
                      <PhotoPlaceholder className="size-7" />
                    </span>
                  )}
                </span>
                {/* 상태 배지: 선택=체크 / 해제=빈 원 */}
                <span
                  className={`absolute -right-1 -top-1 flex size-[22px] items-center justify-center rounded-full border-2 border-white transition ${
                    selected ? 'bg-[#7f9648] text-white' : 'bg-white text-transparent ring-1 ring-inset ring-[#d4d4d4]'
                  }`}
                >
                  <CheckIcon className="size-3" />
                </span>
              </span>
            </button>

            {/* 라벨 */}
            <div
              className="pointer-events-none absolute w-[120px] -translate-y-1/2"
              style={{ top: y, ...labelStyle }}
            >
              <div className="animate-roadmap-pop" style={{ animationDelay: labelDelay }}>
                <p
                  className={`line-clamp-2 text-[15px] font-medium transition-colors ${
                    selected ? 'text-[#20251f]' : 'text-[#b4b4b4]'
                  }`}
                >
                  {tree.name}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
