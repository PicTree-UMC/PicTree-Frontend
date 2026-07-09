import { useQuery } from "@tanstack/react-query";
import { getTimeline } from "../api/timelineApi";
import type {
  TimelineGroup,
  TimelineRecord,
  PlanType,
} from "../types/timeline.types";

/**
 * TanStack Query 캐시 키.
 * (useDeleteRecord 에서 이 키로 invalidate → 타임라인이 자동 갱신됨)
 */
export const timelineKeys = {
  all: ["timeline"] as const,
};

// 요일 표시용 (Date.getDay() 는 0=일 ~ 6=토 를 반환)
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// Date → "2025-04-01" 문자열. 같은 날인지 비교하고 그룹 키로 쓰기 위함
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// 두 날짜가 같은 날인지 (연-월-일 문자열로 비교)
const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);

/**
 * 그룹 헤더 라벨 만들기 → "오늘 - 4월 1일 (수)"
 * 오늘/어제면 접두어를 붙이고, 그 외에는 날짜만 표시.
 */
const buildLabel = (date: Date, today: Date): string => {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let prefix = "";
  if (isSameDay(date, today)) prefix = "오늘 - ";
  else if (isSameDay(date, yesterday)) prefix = "어제 - ";

  const md = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return `${prefix}${md} (${WEEKDAYS[date.getDay()]})`;
};

/**
 * 기록 목록을 날짜별 그룹으로 묶고 최신순 정렬.
 *
 */
const groupByDate = (
  records: TimelineRecord[],
  now: Date = new Date()
): TimelineGroup[] => {
  const map = new Map<string, TimelineRecord[]>();

  // 1) 같은 날짜끼리 버킷에 담기
  for (const record of records) {
    const key = toDateKey(new Date(record.recordedAt));
    const bucket = map.get(key);
    if (bucket) bucket.push(record);
    else map.set(key, [record]);
  }

  return Array.from(map.entries())
    // 2) 날짜 키 내림차순 (문자열 비교로 최신 날짜가 먼저)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      label: buildLabel(new Date(dateKey), now),
      // 3) 그룹 내부는 기록 시각 내림차순
      records: items.sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    }));
};

/** 이 훅이 화면에 돌려주는 값들의 형태 */
interface UseTimelineResult {
  groups: TimelineGroup[]; // 날짜별로 묶인 기록
  totalCount: number; // 총 기록 수
  plan: PlanType; // 'free' | 'premium'
  isLoading: boolean;
  isError: boolean;
}

export const useTimeline = (): UseTimelineResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: timelineKeys.all, // 이 키로 캐시 저장/조회
    queryFn: getTimeline, // 실제 데이터를 가져오는 함수
  });

  return {
    // 데이터가 오면 그룹으로 가공, 아직 없으면 빈 배열
    groups: data ? groupByDate(data.records) : [],
    totalCount: data?.totalCount ?? 0,
    plan: data?.plan ?? "free",
    isLoading,
    isError,
  };
};
