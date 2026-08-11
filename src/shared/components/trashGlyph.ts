import type { GlyphBox } from './IconFrame';

/**
 * 휴지통 글리프 — lucide `trash` (24 좌표계).
 *
 * ⚠️ **`trash-2` 가 아니다.** `trash-2` 는 몸통 안에 세로바 2개가 더 있어 같은 크기
 * 안에 선이 5개가 된다. 액션 줄에서 선 1개짜리 하트·2개짜리 연필과 나란히 서면
 * 휴지통만 유독 진해 보였다 — 굵기는 셋 다 같은데도 그랬다. 바를 뺀 `trash` 는
 * 선이 3개라 밀도가 붙는다.
 *
 * ⚠️ **path 는 여기 하나뿐이어야 한다.** 예전에는 앱 안에 휴지통이 5종 있었다 —
 * 인라인 3종(액션 줄 / 삭제 모달 둘 / 개인정보 안내)과 에셋 2종(`trashcan.svg` 는
 * 선, `trashLarge.svg` 는 면). 뜻은 하나인데 모양·굵기·색이 다 달랐고, 에셋 쪽은
 * 빨강(`#FF3F3F`·`#DC2626`)이 파일에 박혀 있어 `currentColor` 로 돌지 못했다.
 * 색 토큰이 없던 동안 LINE 회색이 6종으로 자랐던 것과 같은 일이다(이슈 #58).
 *
 * 컴포넌트가 아니라서 파일을 나눴다 — 같은 파일에서 상수와 컴포넌트를 함께
 * 내보내면 Fast Refresh 가 깨진다(`react-refresh/only-export-components`).
 */
export const TRASH_GLYPH =
  'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2';

/**
 * `IconFrame` 이 크기를 맞출 때 쓰는 글리프 경계 상자.
 *
 * 한 줄에 다른 아이콘과 나란히 놓는 자리(액션 줄)에서만 쓴다. 혼자 서는 자리는
 * `TrashIcon` 이 24 박스를 그대로 쓴다 — 맞출 상대가 없다.
 */
export const TRASH_BOX: GlyphBox = { cx: 12, cy: 12, w: 18, h: 20 };
