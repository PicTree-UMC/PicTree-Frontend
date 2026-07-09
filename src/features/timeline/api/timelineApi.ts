import { axiosInstance } from "@/shared/lib/axiosInstance";
import type { TimelineResponse } from "../types/timeline.types";

/**
 * 타임라인 API 호출부
 *
 *       엔드포인트 경로(/timeline 등)는 백엔드 확정 후 교체예정
 */

/** 저장된 장소 기록 목록 조회 (최신순은 클라이언트에서 그룹/정렬) */
export const getTimeline = async (): Promise<TimelineResponse> => {
  const { data } = await axiosInstance.get<TimelineResponse>("/timeline");
  return data;
};

/** 기록 1건 삭제 — 성공 시 지도 마커도 서버에서 함께 제거됨 */
export const deleteRecord = async (recordId: string): Promise<void> => {
  await axiosInstance.delete(`/timeline/${recordId}`);
};
