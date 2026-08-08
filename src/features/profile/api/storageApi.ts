import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope } from '@/features/home/types/tree';
import { fetchAllTreeItems } from '@/features/home/api/treesApi';

/** `GET /trees/{treeId}/images` 응답 중 용량 계산에 필요한 부분만. */
interface TreeImagesData {
  images?: { fileSize?: number }[];
}

/**
 * 요약 띠가 쓰는 통계 한 묶음.
 *
 * **셋이 한 함수에서 나오는 게 핵심이다.** 나무 목록과 나무별 사진 목록은 용량을 재려고
 * 어차피 다 받아 오는데, 그루 수와 장수는 그걸 세기만 하면 된다 — **요청이 늘지 않는다.**
 * 따로 훅을 파면 같은 순회를 한 번 더 돌게 된다.
 */
export interface StorageStats {
  /** 사진 바이트 합. */
  usedBytes: number;
  /** 살아 있는 나무 수(소프트 삭제된 것은 목록에 안 온다). */
  treeCount: number;
  /** 사진 장수. */
  photoCount: number;
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
export async function getStorageStats(): Promise<StorageStats> {
  const trees = await fetchAllTreeItems();

  const photos = await Promise.all(trees.map((tree) => fetchTreeImages(tree.treeId)));

  return {
    usedBytes: photos.reduce((sum, tree) => sum + tree.bytes, 0),
    treeCount: trees.length,
    photoCount: photos.reduce((sum, tree) => sum + tree.count, 0),
  };
}

/**
 * 나무 한 그루의 사진 장수와 용량 합.
 *
 * 한 그루가 실패해도 전체를 버리지 않는다 — 사진 한 묶음을 못 읽었다고 용량 전체가
 * `-` 로 돌아가면, 맞는 값 대부분을 버리는 셈이다. 대신 그만큼 **적게** 잡힌다.
 * 장수도 같은 규칙을 따른다. 둘이 어긋나면 "사진 0장인데 용량은 있다" 가 되어 더 이상하다.
 */
async function fetchTreeImages(treeId: number): Promise<{ bytes: number; count: number }> {
  try {
    const { data } = await httpClient.get<ApiEnvelope<TreeImagesData>>(
      `/trees/${treeId}/images`,
    );
    const images = data.data?.images ?? [];

    return {
      bytes: images.reduce((sum, image) => sum + (image.fileSize ?? 0), 0),
      count: images.length,
    };
  } catch {
    return { bytes: 0, count: 0 };
  }
}
