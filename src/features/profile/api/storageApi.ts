import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope, TreeListData } from '@/features/home/types/tree';

/** 서버가 허용하는 최대 페이지 크기(`TreePagination.MAX_SIZE`). */
const MAX_PAGE_SIZE = 100;

/** `GET /trees/{treeId}/images` 응답 중 용량 계산에 필요한 부분만. */
interface TreeImagesData {
  images?: { fileSize?: number }[];
}

/**
 * 사진 저장 사용량(byte) 계산.
 *
 * ⚠️ **서버에 합계 API 가 없어서 프론트가 직접 더한다.** `tree_images.file_size`
 * 는 업로드 때 실제 바이트로 저장되고(`fileSize: file.size`) 조회 응답에도
 * 그대로 실려 오므로, 값 자체는 정확하다.
 *
 * 나무를 지우면 사진 행도 하드 삭제되므로(나무만 소프트 삭제) 살아 있는 나무만
 * 훑어도 합계가 맞다.
 *
 * 비용이 크다 — 나무 수만큼 요청이 나가고, 서버는 사진 한 장마다 presigned URL
 * 을 발급한다(우리는 안 쓰는데도). 그래서 이 함수를 **화면을 열 때마다 부르면
 * 안 된다.** `useStorageUsage` 가 캐시를 무기한 유지하고 사진이 늘거나 줄 때만
 * 무효화한다.
 *
 * 백엔드에 `SUM(file_size)` 한 방짜리 API 를 요청해 둔 상태다. 생기면 이 함수만
 * 갈아끼우면 된다.
 */
export async function getStorageUsedBytes(): Promise<number> {
  const treeIds = await fetchAllTreeIds();

  const sizes = await Promise.all(treeIds.map(fetchTreeImageBytes));

  return sizes.reduce((sum, bytes) => sum + bytes, 0);
}

/**
 * 내 나무 id 전체.
 *
 * `GET /trees` 에 날짜·전체 조회 옵션이 없어 페이지를 끝까지 넘긴다. 첫 응답의
 * `totalPages` 로 남은 페이지를 한 번에 병렬 요청한다 — 순차로 돌면 페이지 수만큼
 * 왕복 시간이 쌓인다.
 */
async function fetchAllTreeIds(): Promise<number[]> {
  const first = await fetchTreePage(1);
  const ids = first.items.map((item) => item.treeId);

  // totalPages 를 못 받으면 첫 페이지만 센다 — 지어내는 것보다 적게 세는 편이 낫다.
  const totalPages = first.totalPages ?? 1;
  if (totalPages <= 1) return ids;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchTreePage(index + 2)),
  );

  return rest.reduce((all, page) => all.concat(page.items.map((i) => i.treeId)), ids);
}

async function fetchTreePage(page: number): Promise<TreeListData> {
  const { data } = await httpClient.get<ApiEnvelope<TreeListData>>('/trees', {
    params: { page, size: MAX_PAGE_SIZE },
  });

  return data.data;
}

/**
 * 나무 한 그루의 사진 용량 합.
 *
 * 한 그루가 실패해도 전체를 버리지 않는다 — 사진 한 묶음을 못 읽었다고 용량 전체가
 * `-` 로 돌아가면, 맞는 값 대부분을 버리는 셈이다. 대신 그만큼 **적게** 잡힌다.
 */
async function fetchTreeImageBytes(treeId: number): Promise<number> {
  try {
    const { data } = await httpClient.get<ApiEnvelope<TreeImagesData>>(
      `/trees/${treeId}/images`,
    );

    return (data.data?.images ?? []).reduce(
      (sum, image) => sum + (image.fileSize ?? 0),
      0,
    );
  } catch {
    return 0;
  }
}
