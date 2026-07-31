import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { RoutePlace } from '../types/route';
import { toDateKey } from '../lib/calendar';

/**
 * 새 동선을 만들 때 고를 수 있는 장소 목록.
 *
 * **한 API 로는 안 나온다.** 필요한 건 `좌표 + 이름 + 방문 날짜` 인데,
 * - `GET /trees` 는 좌표·이름은 주지만 **날짜가 없고**,
 * - `GET /timelines` 는 방문일(`visitedAt`)·`treeId` 는 주지만 **좌표가 없다**.
 *
 * 그래서 `treeId` 로 조인한다. `GET /calendar` 로 대신할 수 없는 이유는 그쪽 `level` 이
 * 개수가 아니라 0~4 잔디 농도라 3곳인지 4곳인지 구분이 안 되기 때문이다 — 캘린더가
 * `n곳` 을 찍고 하단바가 `n/20개` 한도를 세는 이상 정확한 개수가 필요하다.
 *
 * 백엔드가 `/calendar` 에 `count` 를 얹어주면 이 조인은 통째로 사라질 수 있다(요청해둘 것).
 *
 * ⚠️ **`home/treesApi` 와 `timeline/timelineApi` 를 재사용하지 않는다.** 그쪽은 DEV 에서
 * 호출이 실패하면 목데이터로 폴백하는데, 여기서 나온 장소는 그대로 `POST /routes` 의
 * `treeId` 가 된다 — 가짜 id 가 섞이면 저장이 400 으로 떨어지고 원인도 안 보인다.
 */

/** 서버가 한 번에 주는 최대치. 지도(`treesApi`)가 이미 100 으로 부르고 있다. */
const PAGE_SIZE = 100;

/**
 * 페이지 순회 상한. **서버가 `page` 를 무시하면 같은 페이지를 무한히 받는다** —
 * `/routes`·`/trees` 는 스웨거에 요청 파라미터가 없는데 실제로는 먹는 상태라
 * 언제 바뀔지 모른다. 새 항목이 안 늘면 아래에서 먼저 끊지만, 그것마저 못 믿을 때의 바닥이다.
 */
const MAX_PAGES = 20;

interface TreeItem {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  mood: string | null;
}

interface TreeListData {
  items: TreeItem[] | null;
  total: number;
}

interface TimelineItem {
  id: number;
  treeId: number | null;
  title: string;
  /** ISO 8601 방문 일시. 날짜만 쓰지만 서버는 시각까지 준다. */
  visitedAt: string | null;
}

interface TimelineListData {
  items: TimelineItem[] | null;
  totalElements: number;
  hasNext: boolean;
}

/** ISO 일시 → 'YYYY-MM-DD'. **로컬 기준**이다 — 캘린더도 로컬 Date 로 칸을 만든다. */
const visitDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

const fetchAllTrees = async (): Promise<TreeItem[]> => {
  const trees: TreeItem[] = [];
  const seen = new Set<number>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await httpClient.get<ApiResponse<TreeListData>>('/trees', {
      params: { page, size: PAGE_SIZE },
    });

    const items = data.data?.items ?? [];
    const fresh = items.filter((item) => !seen.has(item.treeId));
    fresh.forEach((item) => {
      seen.add(item.treeId);
      trees.push(item);
    });

    // 새로 들어온 게 없으면 마지막 페이지이거나 서버가 page 를 무시한 것이다. 둘 다 그만.
    if (fresh.length === 0 || trees.length >= (data.data?.total ?? trees.length)) break;
  }

  return trees;
};

const fetchAllTimelines = async (): Promise<TimelineItem[]> => {
  const records: TimelineItem[] = [];
  const seen = new Set<number>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await httpClient.get<ApiResponse<TimelineListData>>('/timelines', {
      params: { page, size: PAGE_SIZE },
    });

    const items = data.data?.items ?? [];
    const fresh = items.filter((item) => !seen.has(item.id));
    fresh.forEach((item) => {
      seen.add(item.id);
      records.push(item);
    });

    if (fresh.length === 0 || !data.data?.hasNext) break;
  }

  return records;
};

/**
 * 방문 기록이 있는 장소들을 방문 순서대로. 배열 순서가 곧 동선의 기본 순서다.
 *
 * **기준은 나무가 아니라 방문 기록이다** — 같은 장소를 다른 날 또 갔으면 두 번 나와야
 * 하고(날짜가 다르니 다른 점이다), 방문 기록이 없는 나무는 찍을 날짜가 없어 빠진다.
 * 화면설계서 1번의 '나무를 심은 날짜만 선택 가능'이 여기서 '방문 기록이 있는 날짜'가 된다
 * — 카메라 저장이 나무와 타임라인을 함께 만들면 둘은 같은 뜻이 된다(카메라는 아직 미연동).
 */
export const getRoutePlaceCandidates = async (): Promise<RoutePlace[]> => {
  const [trees, timelines] = await Promise.all([fetchAllTrees(), fetchAllTimelines()]);
  const treeById = new Map(trees.map((tree) => [tree.treeId, tree]));

  return timelines
    .flatMap((record) => {
      const tree = record.treeId === null ? undefined : treeById.get(record.treeId);
      const date = record.visitedAt ? visitDateKey(record.visitedAt) : '';
      // 나무에 연결되지 않은 기록은 좌표가 없어 지도에 못 찍는다(타임라인은 나무 없이도 쓴다).
      if (!tree || !date) return [];

      return [{ tree, date, visitedAt: record.visitedAt as string, name: record.title }];
    })
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
    .map(
      ({ tree, date }, index): RoutePlace => ({
        // 같은 나무를 두 번 방문하면 treeId 가 겹친다 → 화면용 키는 순서로 만든다.
        id: index,
        treeId: tree.treeId,
        // 이름은 나무 쪽을 쓴다. 타임라인 title 은 사용자가 따로 고칠 수 있어 지도의
        // 다른 화면(홈)과 어긋날 수 있다.
        name: tree.name,
        lat: tree.latitude,
        lng: tree.longitude,
        date,
        mood: tree.mood ?? undefined,
      }),
    );
};
