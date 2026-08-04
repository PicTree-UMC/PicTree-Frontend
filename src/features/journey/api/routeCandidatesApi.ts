import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type { RoutePlace } from '../types/route';
import { toDateKey } from '../lib/calendar';

/**
 * 새 동선을 만들 때 고를 수 있는 장소 목록.
 *
 * **2026-08-04 — `/trees` ⋈ `/timelines` 조인이 사라졌다.** 백엔드가 timeline 을 tree 로
 * 합치면서(#123) `/timelines` 라우트 자체가 없어졌다. 예전에는 좌표(`/trees`)와
 * 방문일(`/timelines`)이 서로 다른 API 에 나뉘어 있어 `treeId` 로 이어 붙여야 했다.
 * 이제 나무 하나가 곧 방문 하나라 **한 번만 부르면 된다.**
 *
 * 화면설계서 1번의 '나무를 심은 날짜만 선택 가능' 도 이제 말 그대로가 됐다 —
 * 예전에는 '방문 기록이 있는 날짜' 로 한 겹 번역해야 했다.
 *
 * 🔴 **다만 `GET /trees` 가 날짜를 주지 않으면 후보가 통째로 비어 버린다.**
 * 이 화면은 "날짜를 고르면 그날의 장소를 그린다" 가 전부라 날짜 없는 장소는 쓸 데가 없다.
 * 2026-08-04 스웨거 기준 목록 아이템에 날짜 필드가 없다 — 백엔드에 `visitedAt` 을
 * 요청해 둔 상태다(HANDOFF 1-1절 1번). 아래는 `visitedAt` 이든 `createdAt` 이든
 * **오는 대로 받아 쓰도록** 해 뒀다. 필드가 붙는 순간 이 파일을 안 고쳐도 살아난다.
 *
 * ⚠️ **`home/treesApi` 를 재사용하지 않는다.** 그쪽은 DEV 에서 호출이 실패하면 목데이터로
 * 폴백하는데, 여기서 나온 장소는 그대로 `POST /routes` 의 `treeId` 가 된다 —
 * 가짜 id 가 섞이면 저장이 400 으로 떨어지고 원인도 안 보인다.
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
  /**
   * 방문 일시. **아직 서버가 안 준다**(위 🔴 주석). 붙는 날 그대로 쓰인다.
   * `createdAt` 은 차선책 — 등록 시각이지만 촬영과 등록이 같은 순간이라 실용상 같다.
   */
  visitedAt?: string | null;
  createdAt?: string | null;
}

interface TreeListData {
  items: TreeItem[] | null;
  total: number;
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

/**
 * 방문한 장소들을 방문 순서대로. 배열 순서가 곧 동선의 기본 순서다.
 *
 * 날짜가 없는 장소는 뺀다 — 날짜별로 그리는 화면이라 찍을 칸이 없다.
 * (통합 전에는 '나무에 연결되지 않은 기록' 을 같은 이유로 뺐다. 그런 기록은 이제 없다.)
 */
export const getRoutePlaceCandidates = async (): Promise<RoutePlace[]> => {
  const trees = await fetchAllTrees();

  return trees
    .flatMap((tree) => {
      const visitedAt = tree.visitedAt ?? tree.createdAt ?? '';
      const date = visitedAt ? visitDateKey(visitedAt) : '';
      if (!date) return [];

      return [{ tree, date, visitedAt }];
    })
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
    .map(
      ({ tree, date }, index): RoutePlace => ({
        // 화면용 키. treeId 를 그대로 쓰지 않는 건 정렬 순서가 곧 동선 순번이기 때문이다.
        id: index,
        treeId: tree.treeId,
        name: tree.name,
        lat: tree.latitude,
        lng: tree.longitude,
        date,
        mood: tree.mood ?? undefined,
      }),
    );
};
