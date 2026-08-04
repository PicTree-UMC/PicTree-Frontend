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
  // thumbnails 키는 지웠다 — 목록이 사진 URL 을 직접 준다(#123).
  images: (timelineId: string) => ["timeline", "images", timelineId] as const,
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
 * 방문 날짜로 묶는다.
 *
 * 그룹 머리글도 정렬과 같은 날짜를 봐야 한다 — `getSortDate` 를 함께 쓰는 이유다.
 * 정렬은 방문일로 해 놓고 머리글만 다른 날짜면 "4월 1일" 아래에 3월 기록이
 * 섞여 읽힌다.
 *
 * 그룹의 앞뒤 순서도 정렬 방향을 따른다. 오래된 순인데 날짜 머리글이 최신부터면
 * 안쪽만 뒤집힌 꼴이 된다. 그룹 안쪽은 `sortRecords` 가 잡아 둔 순서를 그대로 쓴다.
 */
/**
 * 날짜를 못 받은 기록들이 모이는 그룹의 키.
 *
 * ⚠️ **없으면 화면에 `NaN월 NaN일` 이 찍힌다.** `new Date('')` 는 Invalid Date 이고
 * 그걸로 만든 키가 `"NaN-NaN-NaN"`, 머리글이 `"NaN월 NaN일"` 이 된다.
 * 지금 `GET /trees` 목록이 날짜를 안 줘서 실제로 그렇게 떴다(#123).
 * 날짜가 없다고 기록을 숨기지는 않는다 — 사진과 장소명은 멀쩡히 보여줄 수 있다.
 */
const NO_DATE_KEY = "";

const groupByDate = (
  records: TimelineRecord[],
  sort: TimelineSort
): TimelineGroup[] => {
  const map = new Map<string, TimelineRecord[]>();
  for (const r of records) {
    const raw = getSortDate(r);
    const date = new Date(raw);
    const key = raw && !Number.isNaN(date.getTime()) ? toDateKey(date) : NO_DATE_KEY;
    const b = map.get(key);
    if (b) b.push(r);
    else map.set(key, [r]);
  }

  const direction = sort === "recent" ? -1 : 1;

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -direction : direction))
    .map(([dateKey, items]) => ({
      dateKey,
      // 날짜 없는 그룹은 머리글을 비운다. 화면은 빈 문자열이면 아무것도 안 그린다.
      label: dateKey === NO_DATE_KEY ? "" : buildLabel(new Date(dateKey)),
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
 * 타임라인 목록 조회 훅. `GET /trees` (통합 전에는 `GET /timelines` — #123)
 *
 * 화면은 날짜별 그룹을 요구하므로 여기서 묶는다.
 *
 * 🔴 **날짜가 오지 않으면 그룹이 무너진다.** `GET /trees` 아이템에는 날짜 필드가 없어
 * `recordedAt` 이 빈 문자열로 떨어질 수 있다(`timelineApi` 상단 주석). 그러면 모든 기록이
 * 한 덩어리로 묶인다. 백엔드에 `visitedAt`(최소 `createdAt`) 을 요청해 둘 것.
 *
 * ⚠️ 검색·정렬은 서버가 아니라 여기서 한다. 쿼리 파라미터가 `page`·`size` 뿐이라
 * 서버에 넘길 수단이 없다. 따라서 받아온 페이지 안에서만 동작하며, 기록이 한 페이지를
 * 넘어가면 뒤쪽은 검색에 걸리지 않는다.
 * 백엔드에 `keyword`·`sort` 가 생기면 `timelineApi` 로 옮겨야 한다.
 */
export const useTimeline = ({
  page = 1,
  size = TIMELINE_PAGE_SIZE,
  keyword = "",
  sort = "recent",
}: UseTimelineOptions = {}): UseTimelineResult => {
  const accessToken = useAuthStore((state) => state.accessToken);
  /**
   * 토큰이 없으면 부르지 않는다. `GET /trees` 에 인증이 걸려 있어 빈 토큰으로
   * 보내면 반드시 401 이 떨어진다 — 실패가 뻔한 요청이다.
   * (`ProtectedRoute` 가 토큰을 보장하니 실제로는 닿기 어려운 경로다)
   */
  const isEnabled = Boolean(accessToken);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: timelineKeys.list(page, size),
    queryFn: () => getTimelines({ page, size }),
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

  /*
   * 썸네일 조인이 사라졌다 — 목록(`GET /trees`)이 `imageUrl` 을 직접 준다(#123).
   * 예전에는 타임라인 응답에 사진이 아예 없어 나무 목록을 따로 받아 `treeId` 로 이었다.
   */
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
