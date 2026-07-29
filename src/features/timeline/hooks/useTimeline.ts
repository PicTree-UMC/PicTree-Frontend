import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getTimelines, TIMELINE_PAGE_SIZE } from "../api/timelineApi";
import type {
  TimelineGroup,
  TimelineRecord,
  PlanType,
} from "../types/timeline.types";
import {
  getSortDate,
  searchRecords,
  sortRecords,
  type TimelineSort,
} from "../lib/timelineQuery";

export const timelineKeys = {
  all: ["timeline"] as const,
  list: (page: number, size: number) => ["timeline", "list", page, size] as const,
  detail: (timelineId: string) => ["timeline", "detail", timelineId] as const,
};

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/**
 * 그룹 머리글. 시안대로 날짜만 쓴다 ("4월 1일").
 *
 * 예전에는 "오늘 · 4월 1일 (수)" 처럼 상대 표기를 앞에 붙였는데, 사진 그리드에서는
 * 머리글이 짧을수록 사진이 눈에 들어와서 뺐다.
 */
const buildLabel = (date: Date): string =>
  `${date.getMonth() + 1}월 ${date.getDate()}일`;
/**
 * 정렬 기준이 보는 날짜로 묶는다.
 *
 * 그룹 헤더도 정렬과 같은 날짜를 써야 한다 — 등록순인데 머리글이 방문일이면
 * "4월 1일" 아래에 3월에 등록한 기록이 섞여 순서가 뒤죽박죽으로 읽힌다.
 * 그룹 안쪽 순서는 `sortRecords` 가 이미 잡아 둔 것을 그대로 유지한다.
 */
const groupByDate = (
  records: TimelineRecord[],
  sort: TimelineSort
): TimelineGroup[] => {
  const map = new Map<string, TimelineRecord[]>();
  for (const r of records) {
    const key = toDateKey(new Date(getSortDate(r, sort)));
    const b = map.get(key);
    if (b) b.push(r);
    else map.set(key, [r]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      label: buildLabel(new Date(dateKey)),
      records: items,
    }));
};

interface UseTimelineResult {
  groups: TimelineGroup[];
  /** 검색 전 전체 개수. 헤더의 "총 N개의 기록" 이 검색으로 흔들리지 않게 한다. */
  totalCount: number;
  /** 검색·정렬을 거친 뒤 실제로 보이는 개수. */
  visibleCount: number;
  plan: PlanType;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface UseTimelineOptions {
  page?: number;
  size?: number;
  /** 장소명·한줄평 검색어. 빈 문자열이면 거르지 않는다. */
  keyword?: string;
  sort?: TimelineSort;
}

/**
 * 타임라인 목록 조회 훅. `GET /timelines`
 *
 * 화면은 날짜별 그룹을 요구하므로 여기서 묶는다.
 *
 * ⚠️ 검색·정렬은 서버가 아니라 여기서 한다. `GET /timelines` 의 쿼리 파라미터가
 * `page`·`size` 뿐이라 서버에 넘길 수단이 없다. 따라서 받아온 페이지 안에서만
 * 동작하며, 기록이 한 페이지를 넘어가면 뒤쪽은 검색에 걸리지 않는다.
 * 백엔드에 `keyword`·`sort` 가 생기면 `timelineApi` 로 옮겨야 한다.
 */
export const useTimeline = ({
  page = 1,
  size = TIMELINE_PAGE_SIZE,
  keyword = "",
  sort = "recent",
}: UseTimelineOptions = {}): UseTimelineResult => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasToken = Boolean(accessToken);
  /**
   * 토큰이 없어도 개발 환경에서는 쿼리를 돌린다 — `timelineApi` 가 목데이터로
   * 폴백하므로, 여기서 막아 버리면 로컬에서 화면이 계속 비어 있게 된다.
   */
  const isEnabled = hasToken || import.meta.env.DEV;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: timelineKeys.list(page, size),
    queryFn: () => getTimelines(accessToken ?? "", { page, size }),
    enabled: isEnabled,
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

  const visible = sortRecords(searchRecords(data?.records ?? [], keyword), sort);

  return {
    groups: groupByDate(visible, sort),
    totalCount: data?.totalCount ?? 0,
    visibleCount: visible.length,
    /**
     * ⚠️ 타임라인 응답에는 요금제 정보가 없다. 무료/유료 구분은 `GET /users/me` 의
     * `currentPlan` 을 써야 하는데 그 연동은 `feat/myInfo` 브랜치에 있어 여기서는
     * 쓸 수 없다. 두 작업이 합쳐지면 `useMyProfile` 값으로 교체한다.
     */
    plan: "free",
    /**
     * 쿼리가 꺼져 있으면 `isPending` 이 계속 true 다. 그대로 내보내면 화면이
     * 로딩 스피너에서 영영 안 벗어나므로 로딩으로 치지 않는다.
     * (`ProtectedRoute` 가 토큰을 보장하니 실제로는 닿기 어려운 경로다)
     */
    isLoading: isEnabled && isPending,
    isError,
    refetch,
  };
};
