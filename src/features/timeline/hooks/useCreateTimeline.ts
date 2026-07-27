import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useToast } from "@/shared/components";
import { createTimeline } from "../api/timelineApi";
import { getTimelineErrorMessage } from "../lib/timelineError";
import { timelineKeys } from "./useTimeline";
import type { CreateTimelineRequest } from "../types/timeline.types";

/**
 * 타임라인 기록 생성 mutation 훅. `POST /timelines`
 *
 * 성공하면 목록 캐시를 통째로 무효화한다. 새 기록이 어느 날짜 그룹에 들어갈지,
 * 몇 페이지에 걸릴지는 서버 정렬에 달려 있어 낙관적으로 끼워 넣기 어렵다.
 * 목록은 곧바로 다시 불러오는 편이 정확하다.
 *
 * 성공 토스트는 띄우지 않는다 — 생성 직후 어디로 이동할지(상세·목록)는
 * 호출하는 화면이 정하고, 그 화면이 상황에 맞는 안내를 하는 편이 자연스럽다.
 */
export const useCreateTimeline = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (payload: CreateTimelineRequest) =>
      createTimeline(accessToken ?? "", payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },

    onError: (error) => {
      showToast(getTimelineErrorMessage(error, "기록을 저장하지 못했어요."), "error");
    },
  });
};
