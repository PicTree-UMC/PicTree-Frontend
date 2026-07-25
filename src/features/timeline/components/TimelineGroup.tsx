import type { TimelineGroup as Group, TimelineRecord } from "../types/timeline.types";
import TimelineCard from "./TimelineCard";

interface Props {
  group: Group;
  onOpenMenu: (record: TimelineRecord) => void;
}

export default function TimelineGroup({ group, onOpenMenu }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-[#111]">{group.label}</h2>
        <div className="mt-1 h-px w-full bg-[#C5D89D]" />
      </div>
      <ul className="flex flex-col gap-3">
        {group.records.map((record) => (
          <TimelineCard
            key={record.id}
            record={record}
            onOpenMenu={onOpenMenu}
          />
        ))}
      </ul>
    </section>
  );
}
