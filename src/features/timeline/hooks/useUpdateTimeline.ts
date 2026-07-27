import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useToast } from "@/shared/components";
import { updateTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";
import { timelineKeys } from "./useTimeline";
import type { UpdateTimelineRequest } from "../types/timeline.types";

interface UpdateTimelineVariables {
  timelineId: string;
  payload: UpdateTimelineRequest;
}

/**
 * 타임라인 기록 수정 mutation 훅. `PATCH /timelines/{timelineId}`
 *
 * 성공하면 `timelineKeys.all` 을 무효화해 목록과 상세를 함께 다시 불러온다.
 * `visitedAt` 이 바뀌면 속한 날짜 그룹까지 달라지므로 목록도 갱신되어야 한다.
 */
export const useUpdateTimeline = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: ({ timelineId, payload }: UpdateTimelineVariables) =>
      updateTimeline(accessToken ?? "", timelineId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },

    onError: (error) => {
      showToast(getTimelineErrorMessage(error, "기록을 수정하지 못했어요."), "error");
    },
  });
};
