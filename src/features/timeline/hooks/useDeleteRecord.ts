import { useMutation, useQueryClient } from "@tanstack/react-query";

import { treeKeys } from "@/features/home/hooks/useTrees";
import { treeStatsKeys } from "@/features/profile/hooks/useTreeStats";
import { calendarKeys } from "@/features/profile/hooks/useTravelCalendar";
import { useToast } from "@/shared/components";
import { deleteTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";

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
      /*
        `['trees']` 하나가 원본(타임라인·지도·동선 후보·블로그)과 상세를 함께 덮는다.
        예전에는 `timelineKeys.all`·`routePlaceCandidateKey` 를 더 나열했다(이슈 #237).
      */
      queryClient.invalidateQueries({ queryKey: treeKeys.all });
      // 잔디는 나무 개수로 그려지므로 장소가 사라지면 같이 옅어져야 한다.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      // 나무를 지우면 사진도 함께 지워진다 — 용량도 다시 센다.
      queryClient.invalidateQueries({ queryKey: treeStatsKeys.summary });
      // 확인 문구와 같은 말을 쓴다 — '기록' 이라고 하면 지도의 장소는 남은 줄 안다.
      showToast("장소가 삭제되었습니다.", "success");
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
