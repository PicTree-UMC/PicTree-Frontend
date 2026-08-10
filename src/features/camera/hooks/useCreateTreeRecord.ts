import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTree, uploadTreeImage } from '@/features/home/api/treesApi';
import { treeKeys } from '@/features/home/hooks/useTrees';
import { treeStatsKeys } from '@/features/profile/hooks/useTreeStats';
import { calendarKeys } from '@/features/profile/hooks/useTravelCalendar';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';
import { dataUrlToFile } from '../lib/dataUrlToFile';

export interface CreateTreeRecordInput {
  /** captureFrame 이 만든 data URL. 사진 없이 기록할 때는 null. */
  photo: string | null;
  /** 장소명 → name (필수). */
  placeName: string;
  /** 기분 이모지 → mood (필수, 서버는 이모지 문자를 그대로 저장). */
  mood: string;
  /** 한줄평 → description (선택). */
  comment: string;
  /** 등록 위치. POST /trees 에 필수라 호출 측에서 확보한 뒤 넘긴다. */
  coords: GeoCoords;
}

export interface CreateTreeRecordResult {
  treeId: number;
}

/**
 * 카메라 촬영 → 장소 등록 흐름.
 * 1) POST /trees 로 장소를 만들고 treeId 를 받는다.
 * 2) 사진이 있으면 그 treeId 로 POST /trees/{treeId}/images (단일 파일) 업로드.
 *
 * **2026-08-04 — 3단계였던 흐름이 2단계가 됐다.** 예전에는 `POST /timelines` 로 방문
 * 기록을 따로 남겨야 했다. 그게 없으면 찍은 장소가 동선에 안 떴기 때문인데, 나무를 만들고
 * 기록을 또 만드는 사이에 실패하면 **장소만 남고 동선엔 안 뜨는 반쪽 상태**가 됐다.
 * 그 상태를 화면에 알리려고 `timelineFailed` 를 결과에 실어 보냈었다.
 *
 * 백엔드가 timeline 을 tree 로 합치면서(#123) 그 실패 자체가 사라졌다 — 나무가 곧 기록이다.
 * 반쪽 상태가 없으니 분기도 없앴다.
 */
export function useCreateTreeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photo,
      placeName,
      mood,
      comment,
      coords,
    }: CreateTreeRecordInput): Promise<CreateTreeRecordResult> => {
      const name = placeName.trim();
      const description = comment.trim();
      const { treeId } = await createTree({
        name,
        mood,
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...(description ? { description } : {}),
      });

      if (photo) {
        await uploadTreeImage(treeId, dataUrlToFile(photo, `tree-${treeId}.jpg`));
      }

      return { treeId };
    },
    onSuccess: () => {
      // `list()` 가 아니라 `all` 이다 — 마이페이지 요약의 그루 수(`treeKeys.count()`)도
      // 같이 깨야 한다. 안 그러면 방금 심은 나무가 지도에는 뜨는데 개수는 그대로다.
      /*
        `['trees']` 하나가 원본(지도·타임라인·동선 후보·블로그)과 상세를 함께 덮는다.
        예전에는 `timelineKeys.all`·`routePlaceCandidateKey` 를 더 나열해야 했다 —
        같은 `/trees` 를 가공한 독립 키들이었기 때문이다(이슈 #237).
      */
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
      // 동선 후보는 /routes 와 무관한 독립 키라 위 두 무효화가 닿지 않는다.
      // 안 지우면 staleTime(60s) 동안 방금 찍은 장소가 빠진 목록이 그대로 보인다.
      // 여행 캘린더도 마찬가지로 독립 키(`['calendar', 연, 월]`)다. 이게 빠져 있어서
      // 사진을 찍어도 동선·타임라인에만 뜨고 잔디는 그대로였다.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      // 사진이 늘었다. 용량은 캐시를 무기한 들고 있어 여기서 안 깨면 그대로 남는다.
      queryClient.invalidateQueries({ queryKey: treeStatsKeys.summary });
    },
  });
}
