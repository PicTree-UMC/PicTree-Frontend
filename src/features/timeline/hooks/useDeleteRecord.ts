import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useToast } from "@/shared/components";
import { deleteTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";
import { timelineKeys } from "./useTimeline";

/**
 * 타임라인 기록 삭제 mutation 훅. `DELETE /timelines/{timelineId}`
 *
 * 성공하면 `timelineKeys.all` 을 무효화해 목록과 상세를 함께 갱신한다.
 * 삭제는 되돌릴 수 없으므로 낙관적 제거는 하지 않는다 — 서버가 확인해 준 뒤에
 * 목록에서 사라지는 편이 안전하다.
 */
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (recordId: string) => deleteTimeline(accessToken ?? "", recordId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      showToast("기록이 삭제되었습니다.", "success");
    },

    onError: (error) => {
      // 서버가 준 사유를 그대로 보여준다 (없는 기록·잘못된 id 등)
      showToast(
        getTimelineErrorMessage(error, "삭제에 실패했습니다. 다시 시도해주세요."),
        "error",
      );
    },
  });
};
