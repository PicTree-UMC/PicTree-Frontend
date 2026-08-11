import type { SVGProps } from 'react';

/** 아이콘들의 글리프를 맞출 크기(24 좌표계 기준). 넓이의 한 변으로 읽는다. */
const GLYPH_SIZE = 16;
/** 맞춘 뒤 보이길 바라는 선 굵기. 배율로 나눠 되돌리므로 전부 같아 보인다. */
const GLYPH_STROKE = 1.7;

export interface GlyphBox {
  /** 그려진 부분의 가로 중심. */
  cx: number;
  /** 그려진 부분의 세로 중심. */
  cy: number;
  /** 그려진 부분의 가로 길이. */
  w: number;
  /** 그려진 부분의 세로 길이. */
  h: number;
}

/**
 * 하트·연필·휴지통처럼 한 줄에 나란히 놓는 아이콘의 크기를 맞춰 주는 껍데기.
 *
 * 아이콘들이 같은 24×24 박스를 써도 **실제로 그려진 범위는 제각각이다** — 연필은
 * 위로 붙어 있고(y 2.8~18) 휴지통은 아래로 길다(y 4~22). 그래서 같은 `h-7` 로
 * 나란히 놓아도 높이도 중심도 어긋나 보인다.
 *
 * 각 글리프의 경계 상자를 받아 박스 한가운데로 옮기고 크기를 `GLYPH_SIZE` 에
 * 맞춘다. 배율이 선 굵기까지 함께 늘리므로 굵기는 배율만큼 나눠 되돌린다 —
 * 그래서 **선 굵기는 어느 아이콘이든 `GLYPH_STROKE` 그대로다.**
 *
 * ⚠️ **세로만 맞추면 안 된다.** 예전에는 배율이 `GLYPH_SIZE / h` 였는데, 글리프마다
 * 가로세로 비가 달라서(하트는 옆으로 넓고 휴지통은 세로로 길다) 높이를 맞추면
 * 그려진 폭이 하트 17.5 · 연필 16.0 · 휴지통 14.2 로 23% 벌어졌다. 굵기는 같은데
 * 하트만 크고 휴지통만 옹색해 보이던 이유가 이것이다.
 *
 * 가로세로를 **동시에** 맞출 수는 없다 — 비가 다르니 한쪽을 맞추면 다른 쪽이
 * 벌어진다. 그래서 넓이(가로×세로)의 기하평균을 한 변으로 보고 그걸 맞춘다.
 * 차이가 한 축에 몰리지 않고 양쪽으로 갈려, 어느 축도 11% 안쪽에 든다.
 *
 * 타임라인 피드와 지도 스토리 뷰어가 같은 문제를 겪어서 공용으로 뒀다.
 */
export function IconFrame({
  box,
  children,
  ...svgProps
}: { box: GlyphBox } & SVGProps<SVGSVGElement>) {
  const scale = GLYPH_SIZE / Math.sqrt(box.w * box.h);

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={GLYPH_STROKE / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svgProps}
    >
      <g transform={`translate(12 12) scale(${scale}) translate(${-box.cx} ${-box.cy})`}>
        {children}
      </g>
    </svg>
  );
}
