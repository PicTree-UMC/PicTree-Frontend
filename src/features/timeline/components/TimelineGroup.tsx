import type { TimelineGroup as Group } from "../types/timeline.types";
import TimelineCard from "./TimelineCard";

interface Props {
  group: Group; // 헤더 라벨 + 그 날짜의 기록들
  onDelete: (id: string) => void; // 카드로 그대로 전달 (삭제 처리)
  deletingId?: string | null; // 지금 삭제 중인 기록 id (해당 카드만 비활성화)
}

export default function TimelineGroup({ group, onDelete, deletingId }: Props) {
  return (
    <section>
      <h2 className="px-4 pb-2 pt-4 text-[15px] font-bold text-black">
        {group.label}
      </h2>

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
