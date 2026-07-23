import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRecord } from "../api/timelineApi";
import { timelineKeys } from "./useTimeline";
import { useToast } from "@/shared/components";

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (recordId: string) => deleteRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      showToast("기록이 삭제되었습니다.", "success");
    },
    onError: () => {
      showToast("삭제에 실패했습니다. 다시 시도해주세요.", "error");
    },
  });
};
