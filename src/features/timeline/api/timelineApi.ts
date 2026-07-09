import { httpClient } from "@/shared/lib/httpClient";
import type { TimelineResponse } from "../types/timeline.types";

/**
 *       엔드포인트 경로('/timeline' 등)는 백엔드 확정 후 교체
 */

/** 저장된 장소 기록 목록 조회 (날짜 그룹화·정렬은 useTimeline 에서 처리) */
export const getTimeline = async (): Promise<TimelineResponse> => {
  const { data } = await httpClient.get<TimelineResponse>("/timeline");
  return data;
};

/** 기록 1건 삭제 — 성공 시 지도 마커도 서버에서 함께 제거됨 */
export const deleteRecord = async (recordId: string): Promise<void> => {
  await httpClient.delete(`/timeline/${recordId}`);
};