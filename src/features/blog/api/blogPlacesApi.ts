import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
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
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

interface TreeItem {
  treeId: number;
  name: string;
  latitude: number;
  longitude: number;
  mood: string | null;
  defaultImage?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  address?: string | null;
  /** 실제 서버 응답에 포함되는 경우가 있어 optional 로 받는다. */
  createdAt?: string | null;
}

interface TreeListData {
  items: TreeItem[] | null;
  total: number;
}

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

    if (fresh.length === 0 || trees.length >= (data.data?.total ?? trees.length)) break;
  }

  return trees;
};

/**
 * 내 나무(=기록) 전체를 블로그용 레코드로 반환한다.
 *
 * `createdAt` 이 없는 나무는 오늘 날짜로 채워 최소한 목록에는 뜨게 한다
 * (기간 필터 정확도는 떨어지지만, 서버가 날짜를 아직 안 줄 때의 임시 조치).
 */
export const getMyBlogPlaces = async (): Promise<BlogTreeRecord[]> => {
  const trees = await fetchAllTrees();
  const today = new Date().toISOString();

  return trees
    .map((tree) => ({
      treeId: tree.treeId,
      name: tree.name,
      description: tree.description ?? '',
      latitude: tree.latitude,
      longitude: tree.longitude,
      address: tree.address ?? '',
      mood: tree.mood ?? '😌',
      defaultImage: tree.imageUrl || tree.defaultImage || '',
      createdAt: tree.createdAt ?? today,
    } satisfies BlogTreeRecord))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
