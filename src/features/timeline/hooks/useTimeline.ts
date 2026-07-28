import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getTimelines, TIMELINE_PAGE_SIZE } from "../api/timelineApi";
import type {
  TimelineGroup,
  TimelineRecord,
  PlanType,
} from "../types/timeline.types";

export const timelineKeys = {
  all: ["timeline"] as const,
  list: (page: number, size: number) => ["timeline", "list", page, size] as const,
  detail: (timelineId: string) => ["timeline", "detail", timelineId] as const,
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

interface UseTimelineResult {
  groups: TimelineGroup[];
  totalCount: number;
  plan: PlanType;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * 타임라인 목록 조회 훅. `GET /timelines`
 *
 * 서버가 최신순으로 내려주지만 화면은 날짜별 그룹을 요구하므로 여기서 묶는다.
 * 그룹 내부에서 한 번 더 정렬하므로 서버 정렬이 흔들려도 화면은 안전하다.
 */
export const useTimeline = (page = 1, size = TIMELINE_PAGE_SIZE): UseTimelineResult => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasToken = Boolean(accessToken);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: timelineKeys.list(page, size),
    queryFn: () => getTimelines(accessToken ?? "", { page, size }),
    enabled: hasToken,
    /**
     * 4xx 는 재시도하지 않는다. 401(토큰 무효)·400(잘못된 요청)은 같은 요청을
     * 반복해도 결과가 바뀌지 않는다. 5xx·네트워크 오류는 기본값(1회)을 쓴다.
     */
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status && status >= 400 && status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });

  return {
    groups: groupByDate(data?.records ?? []),
    totalCount: data?.totalCount ?? 0,
    /**
     * ⚠️ 타임라인 응답에는 요금제 정보가 없다. 무료/유료 구분은 `GET /users/me` 의
     * `currentPlan` 을 써야 하는데 그 연동은 `feat/myInfo` 브랜치에 있어 여기서는
     * 쓸 수 없다. 두 작업이 합쳐지면 `useMyProfile` 값으로 교체한다.
     */
    plan: "free",
    /**
     * 토큰이 없으면 쿼리가 꺼져 있어 `isPending` 이 계속 true 다.
     * 그대로 내보내면 화면이 로딩 스피너에서 영영 안 벗어나므로 로딩으로 치지 않는다.
     * (`ProtectedRoute` 가 토큰을 보장하니 실제로는 닿기 어려운 경로다)
     */
    isLoading: hasToken && isPending,
    isError,
    refetch,
  };
};
