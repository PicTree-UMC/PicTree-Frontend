import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getTimelineDetail, getTimelineImages } from "../api/timelineApi";
import { timelineKeys } from "./useTimeline";

/**
 * 타임라인 상세 조회 훅. `GET /timelines/{timelineId}`
 *
 * 목록과 queryKey 를 같은 네임스페이스(`timeline`)에 두어, 수정·삭제 시
 * `timelineKeys.all` 하나로 목록과 상세를 함께 무효화할 수 있게 한다.
 */
export const useTimelineDetail = (timelineId?: string) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: timelineKeys.detail(timelineId ?? ""),
    queryFn: () => getTimelineDetail(accessToken ?? "", timelineId ?? ""),
    // id 가 없으면 요청할 대상이 없고, 토큰이 없으면 어차피 401 이다.
    enabled: Boolean(accessToken) && Boolean(timelineId),
    /**
     * 4xx 는 재시도하지 않는다. 400(잘못된 id)·404(없는 기록)·401(토큰 무효)은
     * 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다.
     */
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status && status >= 400 && status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  });
};

/**
 * 한 기록에 붙은 사진 조회 훅. `GET /trees/{treeId}/images?timelineRecordId=`
 *
 * ⚠️ 사진은 타임라인 응답에 없다 — 서버 `toResponseDto` 가 안 실어 준다.
 * 기록별 사진은 `TreeImage.timelineRecordId` 로 저장돼 있고 이 엔드포인트로만
 * 꺼낼 수 있다. 상세 시트는 한 번에 한 기록만 열리므로 호출도 한 번이다.
 * (목록은 기록 수만큼 호출해야 해서 나무 대표 사진으로 대신한다)
 *
 * 나무 없이 남긴 기록(`treeId` 가 null)은 사진이 붙을 자리가 없어 부르지 않는다.
 *
 * presigned URL 이 24시간짜리라 오래 들고 있지 않는다.
 */
export const useTimelineImages = (
  timelineId?: string,
  treeId?: number | null,
) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: timelineKeys.images(timelineId ?? ""),
    queryFn: () => getTimelineImages(treeId as number, timelineId as string),
    enabled: Boolean(accessToken) && Boolean(timelineId) && treeId != null,
    staleTime: 1000 * 60 * 10,
    // 사진이 없어도 상세는 읽을 수 있어야 한다. 실패하면 기본 이미지로 떨어진다.
    retry: false,
  });
};
