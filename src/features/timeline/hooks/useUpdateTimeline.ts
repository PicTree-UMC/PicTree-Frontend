import { useMutation, useQueryClient } from "@tanstack/react-query";

import { treeKeys } from "@/features/home/hooks/useTrees";
import { useToast } from "@/shared/components";
import { updateTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";
import type { UpdateTimelineRequest } from "../types/timeline.types";

interface UpdateTimelineVariables {
  timelineId: string;
  payload: UpdateTimelineRequest;
}

/**
 * 타임라인 기록 수정 mutation 훅. `PATCH /trees/{treeId}`
 *
 * 성공하면 타임라인과 **나무(지도) 캐시를 함께** 무효화한다 — 기록이 곧 나무가 되면서
 * 이름을 고치면 지도 마커 이름도 같이 바뀌기 때문이다(#123). 예전에는 서로 다른
 * 리소스라 타임라인만 갱신하면 됐다.
 */
export const useUpdateTimeline = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ timelineId, payload }: UpdateTimelineVariables) =>
      updateTimeline(timelineId, payload),

    onSuccess: () => {
      // `['trees']` 가 원본을 덮으므로 타임라인·지도가 함께 갱신된다(이슈 #237).
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
    },

    onError: (error) => {
      showToast(getTimelineErrorMessage(error, "기록을 수정하지 못했어요."), "error");
    },
  });
};
