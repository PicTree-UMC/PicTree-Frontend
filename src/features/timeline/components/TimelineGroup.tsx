import type { TimelineGroup as Group } from "../types/timeline.types";
import TimelineCard from "./TimelineCard";

/**
 * 날짜 헤더 + 그 날짜의 카드 목록. 디자인 미확정이라 스타일은 확정 후 반영.
 */
interface Props {
  group: Group; // 헤더 라벨 + 그 날짜의 기록들
  onDelete: (id: string) => void; // 카드로 그대로 전달 (삭제 처리)
  deletingId?: string | null; // 지금 삭제 중인 기록 id (해당 카드만 비활성화)
}

export default function TimelineGroup({ group, onDelete, deletingId }: Props) {
  return (
    <section>
      {/* TODO(디자인): 날짜 헤더 타이포/색상/여백 */}
      <h2>{group.label}</h2>

      <ul>
        {group.records.map((record) => (
          <TimelineCard
            key={record.id}
            record={record}
            onDelete={onDelete}
            isDeleting={deletingId === record.id}
          />
        ))}
      </ul>
    </section>
  );
}