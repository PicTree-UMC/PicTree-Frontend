import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTree, uploadTreeImage } from '@/features/home/api/treesApi';
import { treeKeys } from '@/features/home/hooks/useTrees';
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

/**
 * 카메라 촬영 → 장소 등록 흐름.
 * 1) POST /trees 로 장소를 만들고 treeId 를 받는다.
 * 2) 사진이 있으면 그 treeId 로 POST /trees/{treeId}/images (단일 파일) 업로드.
 * 성공 시 지도 목록 캐시를 무효화해 새 마커가 바로 반영되게 한다.
 */
export function useCreateTreeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photo, placeName, mood, comment, coords }: CreateTreeRecordInput) => {
      const description = comment.trim();
      const { treeId } = await createTree({
        name: placeName.trim(),
        mood,
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...(description ? { description } : {}),
      });

      if (photo) {
        await uploadTreeImage(treeId, dataUrlToFile(photo, `tree-${treeId}.jpg`));
      }

      return treeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treeKeys.list() });
    },
  });
}
