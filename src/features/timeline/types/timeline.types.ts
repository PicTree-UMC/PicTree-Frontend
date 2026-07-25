export type PlanType = "free" | "premium";

export interface TimelineRecord {
  id: string;
  placeName: string;
  comment: string;
  recordedAt: string;
  thumbnailUrl?: string | null;
  lat?: number;
  lng?: number;
}

export interface TimelineResponse {
  totalCount: number;
  records: TimelineRecord[];
  plan: PlanType;
}
export interface TimelineGroup {
  dateKey: string;
  label: string;
  records: TimelineRecord[];
}
