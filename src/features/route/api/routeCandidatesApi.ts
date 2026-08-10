import type { TreeListItem } from '@/features/home/types/tree';
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
 * 날짜는 목록의 `createdAt` 을 쓴다 — 등록 시각을 방문 시각으로 본다(#123).
 * 이 필드는 2026-08-04 에 목록에 추가받은 것이다. 그 전에는 목록에 날짜가 아예 없어
 * **후보가 0개라 새 동선을 만들 수 없었다.**
 *
 * ⚠️ **한때 `home/treesApi` 재사용을 일부러 피했다.** 그쪽 DEV 목 폴백의 가짜 `treeId` 가
 * 그대로 `POST /routes` 로 새서 400 이 나기 때문이었다. 그 이유는 성립하지 않게 됐다 —
 * **폴백은 래퍼(`getTrees()`)에만 있었고 원본 `fetchAllTreeItems()` 는 깨끗했다.** 그
 * 래퍼는 지워졌고 폴백은 지도 훅(`useTrees`)으로 옮겨졌다 — 후보는 깨끗한 원본을
 * `select` 로 가공한 것이라 가짜 id 가 섞일 길이 없다(이슈 #237).
 */

/** ISO 일시 → 'YYYY-MM-DD'. **로컬 기준**이다 — 캘린더도 로컬 Date 로 칸을 만든다. */
const visitDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

/**
 * 방문한 장소들을 방문 순서대로. 배열 순서가 곧 동선의 기본 순서다.
 *
 * 날짜를 못 읽는 장소는 뺀다 — 날짜별로 그리는 화면이라 찍을 칸이 없다. 서버가 필드를
 * 빼먹거나 파싱이 실패할 때의 방어이고, 정상 응답에서는 아무것도 빠지지 않는다.
 * (통합 전에는 '나무에 연결되지 않은 기록' 을 같은 이유로 뺐다. 그런 기록은 이제 없다.)
 */
export const toRoutePlaceCandidates = (trees: TreeListItem[]): RoutePlace[] =>
  trees
    .flatMap((tree) => {
      const date = tree.createdAt ? visitDateKey(tree.createdAt) : '';
      if (!date) return [];

      return [{ tree, date, visitedAt: tree.createdAt }];
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
        imageUrl: tree.imageUrl,
      }),
    );
