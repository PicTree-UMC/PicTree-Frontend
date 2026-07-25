import { httpClient } from "@/shared/lib/httpClient";
import type { TimelineResponse } from "../types/timeline.types";

export const getTimeline = async (): Promise<TimelineResponse> => {
  const { data } = await httpClient.get<TimelineResponse>("/timeline");
  return data;
};

export const deleteRecord = async (recordId: string): Promise<void> => {
  await httpClient.delete(`/timeline/${recordId}`);
};
