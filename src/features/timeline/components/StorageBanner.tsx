interface Props {
  usedLabel: string; 
  totalLabel: string; 
  planLabel: string;
  usedRatio: number;
}

export default function StorageBanner({
  usedLabel,
  totalLabel,
  planLabel,
  usedRatio,
}: Props) {
  return (
    <div className="rounded-[12px] border border-[#C5D89D] bg-[#E4F0CC] px-3.5 py-2.5">
      <p className="text-[10px] font-medium text-[#2C3930]">
        사진 저장 용량 - {usedLabel} / {totalLabel} ({planLabel})
      </p>
      <div className="my-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E3E3E3]">
        <div
          className="h-full rounded-full bg-[#89986D]"
          style={{ width: `${Math.max(0, Math.min(100, usedRatio * 100))}%` }}
        />
      </div>
      <p className="text-[10px] font-medium text-[#2C3930]">
        사진 없는 기록은 용량 제한 없이 무제한으로 저장돼요.
      </p>
    </div>
  );
}
