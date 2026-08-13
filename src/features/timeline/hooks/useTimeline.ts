import { useAuthStore } from "@/features/auth/store/authStore";
import { useAllTrees } from "@/features/home/hooks/useAllTrees";
import { toRecordFromListItem } from "../api/timelineApi";
import type { TreeListItem } from "@/features/home/types/tree";
import type { TimelineGroup, TimelineRecord } from "../types/timeline.types";
import {
  getSortDate,
  searchRecords,
  sortRecords,
  type TimelineSort,
} from "../lib/timelineQuery";

/*
  `timelineKeys` 는 지웠다 — **타임라인은 이제 자기 캐시를 갖지 않는다.**

  `["timeline"]` 은 같은 `GET /trees` 를 이 화면 몫으로 한 번 더 받아 두던 키였고,
  그래서 home·camera 가 나무를 만들거나 지울 때마다 그 키를 **따로 나열해 깨야** 했다.
  하나라도 빠뜨리면 조용히 낡은 화면이 남았다(이슈 #237). 지금은 원본
  (`treeSourceKey`)을 `select` 로 나눠 쓰므로 `['trees']` 무효화 하나에 같이 따라온다.

  타임라인 쪽 낙관적 갱신도 원본을 고친다 — `useToggleTimelineFavorite` 참고.
*/

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
 * 날짜를 못 받은 기록들이 모이는 그룹의 키.
 *
 * ⚠️ **이 방어가 없으면 화면에 `NaN월 NaN일` 이 찍힌다.** `new Date('')` 는 Invalid Date 이고
 * 그걸로 만든 키가 `"NaN-NaN-NaN"`, 머리글이 `"NaN월 NaN일"` 이 된다.
 * 목록에 날짜가 없던 시절 실제로 그렇게 떴다(#123).
 *
 * 지금은 서버가 `createdAt` 을 주므로 이 그룹에 아무도 안 들어온다. 그래도 남긴다 —
 * **서버가 필드를 빠뜨릴 수 있다는 걸 이미 한 번 겪었다.**
 * 날짜가 없다고 기록을 숨기지는 않는다. 사진과 장소명은 멀쩡히 보여줄 수 있다.
 */
const NO_DATE_KEY = "";

/**
 * 방문 날짜로 묶는다.
 *
 * 그룹 머리글도 정렬과 같은 날짜를 봐야 한다 — `getSortDate` 를 함께 쓰는 이유다.
 * 정렬은 방문일로 해 놓고 머리글만 다른 날짜면 "4월 1일" 아래에 3월 기록이
 * 섞여 읽힌다.
 *
 * 그룹의 앞뒤 순서도 정렬 방향을 따른다. 등록순인데 날짜 머리글이 최신부터면
 * 안쪽만 뒤집힌 꼴이 된다. 그룹 안쪽은 `sortRecords` 가 잡아 둔 순서를 그대로 쓴다.
 */
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

/** 원본 나무 → 타임라인 기록. 모듈 최상위 참조로 `select` 에 넘긴다. */
const toTimelineRecords = (trees: TreeListItem[]): TimelineRecord[] =>
  trees.map(toRecordFromListItem);

/**
 * 타임라인 목록 조회 훅. `GET /trees` (통합 전에는 `GET /timelines` — #123)
 *
 * 화면은 날짜별 그룹을 요구하므로 여기서 묶는다.
 *
 * ⚠️ 검색·정렬은 서버가 아니라 여기서 한다. 쿼리 파라미터가 `page`·`size` 뿐이라
 * 서버에 넘길 수단이 없다. 백엔드에 `keyword`·`sort` 가 생기면 `timelineApi` 로 옮긴다.
 *
 * ⚠️ **한 페이지(20개) 안에서만 돌던 제약이 풀렸다**(이슈 #237). 이 훅만 `/trees` 를
 * 1페이지로 받고 있어서 21번째부터는 목록에도, 검색에도 안 걸렸다 — 지도·동선·캘린더가
 * 이미 전체를 받고 있던 것과 어긋난 채였다(#200 과 같은 종류의 잘림이다). 지금은 원본
 * 하나를 나눠 쓰므로 전부 걸린다.
 */
export const useTimeline = ({
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

  /*
    원본 나무를 기록 레코드로 옮긴다. `select` 는 모듈 최상위 함수여야 렌더마다 다시
    돌지 않는다(`useAllTrees` 주석).
  */
  const { data, isPending, isError, refetch } = useAllTrees({
    select: toTimelineRecords,
    enabled: isEnabled,
  });

  /*
   * 썸네일 조인이 사라졌다 — 목록(`GET /trees`)이 `imageUrl` 을 직접 준다(#123).
   * 예전에는 타임라인 응답에 사진이 아예 없어 나무 목록을 따로 받아 `treeId` 로 이었다.
   */
  const visible = sortRecords(searchRecords(data ?? [], keyword), sort);

  return {
    groups: groupByDate(visible, sort),
    totalCount: data?.length ?? 0,
    visibleCount: visible.length,
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
