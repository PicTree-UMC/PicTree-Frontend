import type {
  TimelineGroup,
  TimelineRecord,
  PlanType,
} from "../types/timeline.types";

export const timelineKeys = {
  all: ["timeline"] as const,
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);
const buildLabel = (date: Date, today: Date): string => {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const md = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
  if (isSameDay(date, today)) return `오늘 · ${md}`;
  if (isSameDay(date, yesterday)) return `어제 · ${md}`;
  // 그 외에는 "N일 전 · 날짜" (Figma 라벨)
  const dayMs = 1000 * 60 * 60 * 24;
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      dayMs
  );
  return diff >= 2 ? `${diff}일 전 · ${md}` : md;
};
const groupByDate = (records: TimelineRecord[], now = new Date()): TimelineGroup[] => {
  const map = new Map<string, TimelineRecord[]>();
  for (const r of records) {
    const key = toDateKey(new Date(r.recordedAt));
    const b = map.get(key);
    if (b) b.push(r);
    else map.set(key, [r]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      label: buildLabel(new Date(dateKey), now),
      records: items.sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    }));
};

// 오늘/어제 기준으로 날짜 자동 생성
const now = new Date();
const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const MOCK_RECORDS: TimelineRecord[] = [
  { id: "1", placeName: "오아이스 만난곳", comment: "갤러거 형제 자만추", recordedAt: at(0, 9, 30), thumbnailUrl: "https://picsum.photos/seed/1/88" },
  { id: "2", placeName: "쇼핑", comment: "기념품 구매", recordedAt: at(0, 10, 30), thumbnailUrl: "https://picsum.photos/seed/2/88" },
  { id: "3", placeName: "아침밥 구매", comment: "피자 구매", recordedAt: at(1, 9, 30), thumbnailUrl: "https://picsum.photos/seed/3/88" },
  { id: "4", placeName: "노숙자 만난 곳", comment: "지나가다가 1파운드 기부", recordedAt: at(1, 10, 30), thumbnailUrl: null },
  { id: "5", placeName: "넘어졌던 곳", comment: "바닥 미끄러웠음", recordedAt: at(3, 10, 30), thumbnailUrl: null },
];

interface UseTimelineResult {
  groups: TimelineGroup[];
  totalCount: number;
  plan: PlanType;
  isLoading: boolean;
  isError: boolean;
}

export const useTimeline = (): UseTimelineResult => {
  return {
    groups: groupByDate(MOCK_RECORDS),
    totalCount: MOCK_RECORDS.length,
    plan: "free", // 'premium' 으로 바꾸면 무료 배너 사라짐
    isLoading: false,
    isError: false,
  };
};
