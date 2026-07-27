import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getTimelineDetail } from "../api/timelineApi";
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
