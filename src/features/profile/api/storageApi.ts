import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope } from '@/features/home/types/tree';
import { fetchAllTreeItems } from '@/features/home/api/treesApi';

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
  const trees = await fetchAllTreeItems();

  const sizes = await Promise.all(trees.map((tree) => fetchTreeImageBytes(tree.treeId)));

  return sizes.reduce((sum, bytes) => sum + bytes, 0);
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
