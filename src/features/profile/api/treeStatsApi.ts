import { httpClient } from '@/shared/lib/httpClient';
import type { ApiEnvelope } from '@/features/home/types/tree';

/**
 * 마이페이지 요약이 쓰는 통계 — 그루 수 · 사진 장수 · 사진 용량.
 *
 * **셋이 한 응답으로 온다**(`GET /trees/summary`). 예전에는 서로 다른 곳에서 나왔다:
 * 그루 수는 목록 응답의 `total`, 나머지 둘은 나무를 하나씩 열어 본 합이었다. 그래서
 * 그루 수만 별개 쿼리로 갈라 뒀었는데, 이제 갈라 둘 이유가 없다 — 네 칸이 같이 찬다.
 *
 * ⚠️ 세 값 모두 `null` 이 될 수 있다. 서버가 안 주면 **0 으로 떨어뜨리지 않는다** —
 * 나무가 있는데 0그루라고 하는 것보다 모른다고 두는 편이 낫다. 화면은 `null` 을
 * 스켈레톤이나 `-` 로 받는다.
 */
export interface TreeStats {
  /** 심은 나무 그루 수. */
  treeCount: number | null;
  /** 사진 장수. */
  photoCount: number | null;
  /** 사진 바이트 합. */
  usedBytes: number | null;
}

/**
 * `GET /trees/summary` 응답.
 *
 * ⚠️ 서버 이름은 `imageCount` 다. 프론트는 이 값을 '사진' 으로 부르고 화면 라벨도
 * 그러므로 경계에서 `photoCount` 로 옮긴다 — 여기 말고는 `imageCount` 가 안 보인다.
 */
interface TreeSummaryData {
  treeCount?: number | null;
  imageCount?: number | null;
  usedBytes?: number | null;
}

/**
 * 나무·사진 통계 조회. **요청 한 번이다.**
 *
 * ⚠️⚠️ **이 함수는 통째로 갈아엎어진 것이다.** 종전에는 서버에 합계 API 가 없어
 * 프론트가 `fetchAllTreeItems()` 로 나무를 전부 받고 그루마다
 * `GET /trees/{treeId}/images` 를 불러 `fileSize` 를 더했다 — **나무 34그루면 35요청**
 * 이었고, 서버는 그때마다 사진 한 장씩 presigned URL 을 발급했다(우리는 안 쓰는데도).
 * 요약이 마이페이지 첫 섹션으로 올라가면서 진입할 때마다 그게 돌았다.
 *
 * 백엔드에 요청해 둔 그 API 가 생겼다. **`usedBytes` 만이 아니라 `imageCount`·
 * `treeCount` 까지 함께 준다** — 바이트만 받았다면 장수 때문에 그루별 순회가 그대로
 * 남았을 것이다. 삭제된 나무와 그 사진은 서버가 제외한다(나무는 소프트 삭제, 사진은
 * 하드 삭제라 종전 계산도 살아 있는 것만 훑으면 맞았다 — 두 방식의 결과가 같다).
 */
export async function getTreeStats(): Promise<TreeStats> {
  const { data } = await httpClient.get<ApiEnvelope<TreeSummaryData>>('/trees/summary');
  const summary = data.data;

  return {
    treeCount: summary?.treeCount ?? null,
    photoCount: summary?.imageCount ?? null,
    usedBytes: summary?.usedBytes ?? null,
  };
}
