import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope, TreeListData, TreeListItem } from '@/features/home/types/tree';
import { toCalendarDate } from '@/shared/lib/calendar';

/** 서버가 허용하는 최대 페이지 크기(`TreePagination.MAX_SIZE`). */
const MAX_PAGE_SIZE = 100;

/** 캘린더 아래 그룹 리스트가 쓰는 나무 한 그루. */
export interface CalendarTree {
  treeId: number;
  name: string;
  /** 한줄평. 안 쓴 장소는 null. */
  description: string | null;
  /** 대표 사진 presigned URL. 없으면 null → 회색 자리로 둔다. */
  imageUrl: string | null;
  /** 유저가 고른 이모지 문자. 서버가 그대로 저장한다. */
  mood: string;
  /** 심은 시각 `오후 3:12`. 목록이 같은 날 안에서 순서를 보여 주는 유일한 단서다. */
  time: string;
  /** 정렬용 원본 ISO. 화면에는 안 나온다. */
  createdAt: string;
}

/** 날짜(`YYYY-MM-DD`) → 그날 심은 나무들. 같은 날 안에서는 심은 순서다. */
export type TreesByDate = Record<string, CalendarTree[]>;

/**
 * ISO 일시 → 로컬 `YYYY-MM-DD`.
 *
 * **로컬 기준이어야 한다** — `CalendarGrid` 도 로컬 `Date` 로 칸을 만들기 때문에, 여기서
 * UTC 로 자르면 자정 근처에 심은 나무가 하루 옆 칸에 붙는다. 같은 이유로 동선 만들기의
 * `routeCandidatesApi` 도 로컬로 자른다.
 */
function localDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return toCalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function localTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}

async function fetchTreePage(page: number): Promise<TreeListData> {
  const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees', {
    params: { page, size: MAX_PAGE_SIZE },
  });

  return data.data;
}

/**
 * 내 나무 전체.
 *
 * ⚠️ **`GET /trees` 에 날짜 필터가 없다.** 그래서 달을 넘길 때마다 그 달치를 받는
 * `/calendar` 와 달리 여기는 한 번에 전부 받아 프론트가 날짜로 나눈다 —
 * `storageApi.fetchAllTreeIds` 와 같은 방식이다(첫 페이지의 `totalPages` 로 나머지를
 * 병렬 요청). 날짜별 조회 API 가 생기면 이 함수만 갈아끼우면 된다.
 *
 * `/calendar` 로 잔디만 그릴 때는 이 비용을 치를 이유가 없으므로, 호출은 **날짜를 처음
 * 누른 뒤에야** 시작된다(`useCalendarTrees` 의 `enabled`).
 */
async function fetchAllTrees(): Promise<TreeListItem[]> {
  const first = await fetchTreePage(1);
  const items = [...(first.items ?? [])];

  // totalPages 를 못 받으면 첫 페이지만 쓴다 — 지어내는 것보다 적게 세는 편이 낫다.
  const totalPages = first.totalPages ?? 1;
  if (totalPages <= 1) return items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchTreePage(index + 2)),
  );

  return rest.reduce((all, page) => all.concat(page.items ?? []), items);
}

/**
 * 날짜별로 묶은 내 나무들.
 *
 * 날짜를 못 읽는 나무는 뺀다 — 붙일 칸이 없다. 서버가 `createdAt` 을 빼먹거나 파싱이
 * 실패할 때의 방어이고, 정상 응답에서는 아무것도 빠지지 않는다.
 */
export async function getTreesByDate(): Promise<TreesByDate> {
  const trees = await fetchAllTrees();
  const byDate: TreesByDate = {};

  for (const tree of trees) {
    const date = tree.createdAt ? localDateKey(tree.createdAt) : '';
    if (!date) continue;

    (byDate[date] ??= []).push({
      treeId: tree.treeId,
      name: tree.name,
      description: tree.description,
      imageUrl: tree.imageUrl,
      mood: tree.mood,
      time: localTimeLabel(tree.createdAt),
      createdAt: tree.createdAt,
    });
  }

  // 페이지 순서를 그대로 믿지 않는다 — 하루 안에서는 심은 순서로 읽혀야 한다.
  for (const list of Object.values(byDate)) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return byDate;
}
