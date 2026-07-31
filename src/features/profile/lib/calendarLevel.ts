/**
 * 잔디 농도 단계.
 *
 * 서버가 나무 개수를 세어 `level`(0~4)로 내려준다. 프론트가 개수로 다시 나누지
 * 않는 이유는 경계(3~4개, 5개 이상)를 양쪽에서 각자 정하면 어긋나기 때문이다.
 *
 * | level | 나무 개수 |
 * | 0 | 0개 (표시 없음) |
 * | 1 | 1개 |
 * | 2 | 2개 |
 * | 3 | 3~4개 |
 * | 4 | 5개 이상 |
 *
 * 색과 라벨을 한곳에 두어 격자와 범례가 어긋나지 않게 한다 — 전에는 범례에만
 * 색이 있고 격자는 농도와 무관하게 잔디 아이콘 하나만 그렸다.
 */
export const CALENDAR_LEVELS = [
  { level: 1, shade: "rgba(239,227,177,0.6)", label: "1곳" },
  { level: 2, shade: "rgba(197,216,157,0.6)", label: "2곳" },
  { level: 3, shade: "rgba(177,195,141,0.6)", label: "3~4곳" },
  { level: 4, shade: "rgba(137,152,109,0.6)", label: "5곳+" },
] as const;

/**
 * `CalendarGrid` 에 넘길 색 배열. 인덱스가 곧 level 이라 0 번은 비워 둔다
 * (0 = 방문 없음이라 아무것도 그리지 않는다).
 */
export const CALENDAR_LEVEL_COLORS: string[] = [
  "",
  ...CALENDAR_LEVELS.map((step) => step.shade),
];
