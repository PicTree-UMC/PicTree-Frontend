import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope } from '@/features/home/types/tree';
import { fetchAllTreeItems } from '@/features/home/api/treesApi';

/** `GET /trees/{treeId}/images` 응답 중 용량 계산에 필요한 부분만. */
interface TreeImagesData {
  images?: { fileSize?: number }[];
}

/**
 * 마이페이지 요약이 쓰는 사진 통계.
 *
 * **둘 다 나무를 하나씩 열어 봐야 나오는 값이다** — 그래서 한 묶음이다. 장수만 따로
 * 구하려 해도 같은 순회를 한 번 더 돌게 된다.
 *
 * 그루 수는 여기 없다. 목록 응답의 `total` 로 요청 하나면 나오는 값이라, 이 느린
 * 순회에 묶어 두면 빨리 올 수 있는 값이 늦게 온다 — `useTreeCount` 로 갈랐다.
 *
 * ⚠️ **이 두 값이 곧 백엔드에 요청할 응답 모양이다.** 아래 주석 참고.
 */
export interface StorageStats {
  /** 사진 바이트 합. */
  usedBytes: number;
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
 * 을 발급한다(우리는 안 쓰는데도). `useStorageStats` 가 캐시를 무기한 유지하고
 * 사진이 늘거나 줄 때만 무효화하는 이유다. ⚠️ 요약이 마이페이지 첫 섹션으로
 * 올라가면서 **진입할 때마다** 이 함수가 돈다(그 훅 주석 참고).
 *
 * ⚠️⚠️ **백엔드에 요청해 둔 `SUM(file_size)` API 만으로는 이 비용이 안 없어진다.**
 * `usedBytes` 는 한 방에 오지만 `photoCount` 가 아래 나무별 순회에서 나오기 때문에,
 * 합계만 받아 오면 나무 수만큼의 요청이 **그대로 남는다.** 요청을 고쳐 보내야 한다:
 *
 *   `{ usedBytes, photoCount }` — 같은 쿼리에 `COUNT(*)` 하나 더 붙이는 일이고,
 *   위 `StorageStats` 와 모양이 같다. **그게 오면 이 함수 전체가 한 요청으로 줄고**
 *   아래 나무별 순회가 통째로 빠진다.
 */
export async function getStorageStats(): Promise<StorageStats> {
  const trees = await fetchAllTreeItems();

  const photos = await Promise.all(trees.map((tree) => fetchTreeImages(tree.treeId)));

  return {
    usedBytes: photos.reduce((sum, tree) => sum + tree.bytes, 0),
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
