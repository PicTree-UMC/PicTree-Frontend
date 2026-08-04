import { useMutation, useQueryClient } from "@tanstack/react-query";

import { treeKeys } from "@/features/home/hooks/useTrees";
import { useToast } from "@/shared/components";
import { deleteTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";
import { timelineKeys } from "./useTimeline";

/**
 * 타임라인 기록 삭제 mutation 훅. `DELETE /trees/{treeId}`
 *
 * ⚠️ **이제 기록을 지우면 장소(나무)도 사라진다.** 통합 전에는 기록만 지워지고 나무는
 * 지도에 남았다(그래서 고아 데이터 얘기가 있었다). 지금은 지도 마커까지 함께 없어지므로
 * 나무 캐시도 무효화한다 — 안 하면 지도에 유령 마커가 남는다.
 * **삭제 확인 문구가 이 사실을 말하는지 확인할 것**(`DeleteRecordModal`).
 *
 * 삭제는 되돌릴 수 없으므로 낙관적 제거는 하지 않는다 — 서버가 확인해 준 뒤에
 * 목록에서 사라지는 편이 안전하다.
 */
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (recordId: string) => deleteTimeline(recordId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
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
