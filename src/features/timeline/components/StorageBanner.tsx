import { formatBytes } from "../lib/formatBytes";

interface Props {
  /** 사용 중인 용량(byte). 아직 알 수 없으면 null — 지어내지 않고 "-" 로 둔다. */
  usedBytes: number | null;
  /** 요금제 상한(byte) */
  totalBytes: number;
  planLabel: string;
}

export default function StorageBanner({ usedBytes, totalBytes, planLabel }: Props) {
  const isKnown = usedBytes !== null;
  const usedLabel = isKnown ? formatBytes(usedBytes) : "-";
  const ratio = isKnown && totalBytes > 0 ? usedBytes / totalBytes : 0;

  return (
    <div className="rounded-[12px] border border-[#C5D89D] bg-[#E4F0CC] px-3.5 py-2.5">
      <p className="text-[10px] font-medium text-[#2C3930]">
        사진 저장 용량 - {usedLabel} / {formatBytes(totalBytes)} ({planLabel})
      </p>
      <div className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3E3E3]">
        <div
          className="h-full rounded-full bg-[#89986D] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>
      <p className="text-[10px] font-medium text-[#2C3930]">
        사진 없는 기록은 용량 제한 없이 무제한으로 저장돼요.
      </p>
    </div>
  );
}
