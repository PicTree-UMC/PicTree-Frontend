import type { TreeListItem } from '@/features/home/types/tree';
import type { BlogTreeRecord } from '../types/blog';

/**
 * 블로그 작성 플로우용 "내 기록" 조회.
 *
 * ⚠️ 이 프로젝트는 타임라인(`/timelines`)을 쓰지 않고 나무(`/trees`) 하나로
 * 기록을 관리한다. 실제 배포 서버(tenma.store)에서 `/timelines`·`/blogs/ai/drafts`
 * 는 404 — 아직 없다. `GET /trees` 응답에 코멘트(`description`)까지 실려 오므로
 * 나무 자체를 기록 단위로 쓴다.
 *
 * `createdAt` 이 응답에 있으면 그걸로 기간 필터링을 하고, 없으면(구버전 서버)
 * 필터링 없이 전체를 보여준다 — 캘린더 활동 표시가 비어 보이는 것보다 낫다.
 *
 * ⚠️ **이 파일은 이제 요청을 하지 않는다.** 자기 몫의 `/trees` 페이지 순회를 들고
 * 있었는데(순차, 최대 20페이지) 원본 하나로 접혔다 — 여기 남은 건 순수 변환뿐이다
 * (이슈 #237).
 */

/**
 * 내 나무(=기록) 전체를 블로그용 레코드로 반환한다.
 *
 * `createdAt` 이 없는 나무는 오늘 날짜로 채워 최소한 목록에는 뜨게 한다
 * (기간 필터 정확도는 떨어지지만, 서버가 날짜를 아직 안 줄 때의 임시 조치).
 */
export const toBlogTreeRecords = (trees: TreeListItem[]): BlogTreeRecord[] => {
  const today = new Date().toISOString();

  return trees
    .map((tree) => ({
      treeId: tree.treeId,
      name: tree.name,
      description: tree.description ?? '',
      latitude: tree.latitude,
      longitude: tree.longitude,
      mood: tree.mood ?? '😌',
      // `tree.defaultImage` 로 폴백하지 않는다 — URL 이 아니라 식별자다(BlogTreeRecord 주석).
      imageUrl: tree.imageUrl || '',
      createdAt: tree.createdAt ?? today,
    } satisfies BlogTreeRecord))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
