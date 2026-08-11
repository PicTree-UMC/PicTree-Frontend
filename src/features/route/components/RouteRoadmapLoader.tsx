import { useLayoutEffect, useRef, useState } from 'react';

import { INSET, MAX_W, NODE_EDGE, R, STEP, TOP } from './RouteRoadmap';

/**
 * 몇 개를 그릴지.
 *
 * 실제 장소 수를 모르고 맞힐 방법도 없다. 그래도 여기서는 값이 싸다 — **로드맵은 페이지의
 * 마지막 요소라 뒤에 밀릴 것이 없어서**, 개수가 틀려도 스크롤 길이만 달라진다.
 * (목록 골격에서 개수가 문제였던 건 아래에 다른 내용이 이어졌기 때문이다.)
 *
 * 게다가 이건 멈춰 있는 골격이 아니라 계속 도는 연출이라 "당신 동선은 3곳" 이 아니라
 * "그리는 중" 으로 읽힌다.
 *
 * ⚠️ **`styles.css` 의 `roadmap-loader-node-{1,2,3}` 과 묶여 있다.** 노드마다 등장 시점이
 * 달라야 하는데 `animation-delay` 로는 안 된다(주기가 밀려 마지막 원이 다음 바퀴까지
 * 남는다 — 근거는 그쪽 주석에). 늘리려면 키프레임도 함께 늘려야 한다.
 */
const NODE_COUNT = 3;

/**
 * 동선이 깔리는 모양의 로딩 자리.
 *
 * **이것도 골격이다 — 다른 건 셰이머 하나뿐이다**(#250 에서 정리). 한때 여기 "엄밀히는
 * 스켈레톤이 아니라 이 화면의 언어로 만든 로더다" 라고 적혀 있었는데 **자기 호출부 이름과
 * 어긋났다**(`RouteListSkeleton`). 실제로 하는 일은 골격의 정의 그대로다 — 좌표는
 * `RouteRoadmap` 의 상수를 그대로 받아 쓰고(로딩에서 본 곡선 위에 실제 노드가 그대로 앉아야
 * 갈아타는 순간이 자연스럽다), 같은 얼개를 흐린 톤으로 그린다.
 *
 * ⚠️ **바뀐 건 `animate-pulse` 를 안 쓴다는 것뿐이고, 그 교체에는 문턱이 있다** —
 * **골격의 모양 자체가 거짓 주장을 하는데 pulse 로는 그걸 못 지울 때**만이다. 로드맵은
 * 시작과 끝이 있는 닫힌 도형이라 목록처럼 아래를 흐려 개수를 얼버무리는 수
 * (`skeleton-fade-b`)를 못 쓰고, 동선에서 "이어진다" 는 **"이 여행에 더 들른 곳이 있다"**
 * 가 된다. 멈춰서 맥동하는 3노드 로드맵은 "3곳" 을 주장하지만, **계속 그려지는 중**이면
 * 개수가 주장이 되지 않는다.
 *
 * 이 문턱을 "화면마다 전용 연출을 허용한다" 로 넓히지 말 것. 그러면 다음 사람이 또 하나
 * 만들고 그때 근거는 지금보다 약하다(#250 본문).
 *
 * ⚠️ **점선에 dashoffset 을 직접 걸지 않는다.** 점선이 기어가는 것처럼 보인다 — 같은 경로의
 * 굵은 선을 mask 로 감아 **드러낸다**. `RouteIllustration` 이 먼저 데인 자리이고 거기 주석에도
 * 같은 말이 있다. 다만 여기서는 길이를 상수로 박는 대신 `pathLength={1}` 로 정규화한다
 * (폭이 화면마다 달라 실제 경로 길이를 미리 알 수 없다).
 *
 * ⚠️ **색은 면과 선이 다른 데서 온다.** 노드 안쪽은 골격 팔레트(`cream-sub` =
 * `Skeleton` 의 `surface="cream"`)지만 경로와 테두리는 데코 톤(`pictree-300`)이다.
 * 예외가 아니라 **`Skeleton` 의 `surface` 가 '면' 토큰이라 '선' 역할이 아직 없기 때문**이다.
 *
 * 골격 팔레트를 선에 그대로 쓰면 안 보인다 — 크림 바닥(`#FFFCEF`) 위에서 밝기차(ΔL)가
 * `pictree-300` 0.337 vs `cream-sub` 0.103 · `line-soft` 0.132 로 **1/3 로 떨어진다.**
 * 막대 골격은 채워진 면이라 그 대비로도 형태가 읽히지만, 여기 경로는 `strokeWidth 2.5` 에
 * `strokeDasharray="2 8"` 이라 면적이 없어서 대비가 곧 가시성이다. 중성 회색(`line`)은
 * 밝기는 가깝지만 경로 위에서 "그리는 중" 이 아니라 "끊김·비활성" 으로 읽힌다.
 *
 * 실제 로드맵의 `pictree-500` + 순번 배지 + 사진을 쓰면 저장된 동선으로 오인된다 —
 * 라벨과 배지를 안 그리는 것도 같은 이유다.
 */
export function RouteRoadmapLoader() {
  const boxRef = useRef<HTMLDivElement>(null);
  // path 를 그리려면 실제 폭이 필요하다. 얼개는 `RouteRoadmap` 의 같은 자리와 같다.
  const [width, setWidth] = useState(MAX_W);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    setWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const nodes = Array.from({ length: NODE_COUNT }, (_, index) => ({
    index,
    x: index % 2 === 0 ? INSET : width - INSET,
    y: TOP + index * STEP,
    isLeft: index % 2 === 0,
  }));

  const height = TOP + (NODE_COUNT - 1) * STEP + R + 24;

  // S자 곡선. `RouteRoadmap` 과 같은 제어점 규칙이라 실제 경로와 같은 굴곡이 나온다.
  const path = nodes.reduce((acc, node, index) => {
    if (index === 0) return `M ${node.x} ${node.y}`;
    const prev = nodes[index - 1];
    return `${acc} C ${prev.x} ${prev.y + STEP * 0.55}, ${node.x} ${node.y - STEP * 0.55}, ${node.x} ${node.y}`;
  }, '');

  return (
    <div
      ref={boxRef}
      /*
        낭독기에는 안 읽힌다 — 감싸는 `RouteListSkeleton` 이 `role="status"` 로 한 번만
        알린다. 여기 또 달면 한 화면에 status 가 둘이라 같은 말을 두 번 한다.
      */
      aria-hidden
      className="relative mx-auto w-full max-w-[320px]"
      style={{ height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <defs>
          <mask id="roadmap-loader-reveal">
            {/*
              감기는 쪽. 흰 굵은 선이 위에서부터 드러나며 아래 점선을 조금씩 보여준다.
              `pathLength={1}` 이라 dasharray·dashoffset 이 0~1 로 정규화된다 — 폭이 바뀌어도
              키프레임을 고칠 필요가 없다.
            */}
            <path
              className="roadmap-loader-draw"
              d={path}
              pathLength={1}
              stroke="#fff"
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={1}
            />
          </mask>
        </defs>

        <g mask="url(#roadmap-loader-reveal)">
          <path
            d={path}
            fill="none"
            stroke="#c5d89d"
            strokeWidth={2.5}
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {nodes.map(({ index, y, isLeft }) => (
        <div
          key={index}
          className="absolute size-14 -translate-y-1/2"
          style={{ ...(isLeft ? { left: NODE_EDGE } : { right: NODE_EDGE }), top: y }}
        >
          {/* 선이 자기 자리에 닿을 즈음 튀어오르고, 셋이 같은 시각에 함께 사라진다. */}
          <div
            className={`roadmap-loader-node-${index + 1} size-full rounded-full border-2 border-pictree-300 bg-cream-sub`}
          />
        </div>
      ))}
    </div>
  );
}
