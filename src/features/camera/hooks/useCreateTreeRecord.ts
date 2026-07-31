import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { createTree, uploadTreeImage } from '@/features/home/api/treesApi';
import { treeKeys } from '@/features/home/hooks/useTrees';
import { routePlaceCandidateKey } from '@/features/journey/hooks/useRoutePlaceCandidates';
import { createTimeline } from '@/features/timeline/api/timelineApi';
import { timelineKeys } from '@/features/timeline/hooks/useTimeline';
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
  /**
   * 장소는 저장됐지만 방문 기록(3번)이 실패한 상태. **이 장소는 동선에 뜨지 않는다.**
   * 실패를 통째로 에러로 만들지 않는 이유는 아래 mutationFn 주석 참조.
   */
  timelineFailed: boolean;
}

/**
 * 카메라 촬영 → 장소 등록 흐름.
 * 1) POST /trees 로 장소를 만들고 treeId 를 받는다.
 * 2) 사진이 있으면 그 treeId 로 POST /trees/{treeId}/images (단일 파일) 업로드.
 * 3) POST /timelines 로 같은 treeId 의 방문 기록을 남긴다.
 *
 * **3번이 없으면 찍은 장소가 동선 보기 화면에 영원히 안 뜬다.** 동선 후보는 나무가 아니라
 * 방문 기록을 기준으로 만들어지기 때문이다(`journey/api/routeCandidatesApi.ts`) —
 * `GET /trees` 에 날짜가 없어서 `/timelines` 의 `visitedAt` 과 조인할 수밖에 없고,
 * 기록이 없는 나무는 찍을 날짜가 없어 그 조인에서 통째로 빠진다.
 * 앱에는 방문 기록을 만드는 다른 입구가 없다(타임라인 화면은 조회·수정·삭제뿐).
 *
 * → 백엔드가 `POST /trees` 안에서 기록까지 만들어 주거나 `GET /trees` 가 날짜를 주게 되면
 *   3번은 지워도 된다. 그때까지는 이 호출이 카메라와 동선을 잇는 유일한 연결이다.
 */
export function useCreateTreeRecord() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

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

      /**
       * 여기서 던지지 않는 이유: 나무는 이미 만들어졌다. 실패로 처리하면 사용자가 같은
       * 촬영을 다시 저장하고 나무만 두 개가 된다(POST /trees 는 멱등이 아니다).
       * 대신 결과에 실어 보내 화면이 "장소는 저장됐지만 동선엔 안 뜬다"를 말하게 한다
       * — 조용히 삼키면 나중에 동선에서 안 보이는 이유를 아무도 모른다.
       */
      let timelineFailed = false;

      try {
        await createTimeline(accessToken ?? '', {
          treeId,
          title: name,
          // 카메라에는 분류 UI 가 없다. 촬영 = 그 장소에 다녀온 기록이므로 VISIT 로 고정한다.
          category: 'VISIT',
          // 촬영 시각이 곧 방문 시각이다. 지난 여행을 나중에 올리는 경로는 아직 없다.
          visitedAt: new Date().toISOString(),
          ...(description ? { content: description } : {}),
        });
      } catch {
        timelineFailed = true;
      }

      return { treeId, timelineFailed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKeys.list() });
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      // 동선 후보는 /routes 와 무관한 독립 키라 위 두 무효화가 닿지 않는다.
      // 안 지우면 staleTime(60s) 동안 방금 찍은 장소가 빠진 목록이 그대로 보인다.
      queryClient.invalidateQueries({ queryKey: routePlaceCandidateKey });
    },
  });
}
