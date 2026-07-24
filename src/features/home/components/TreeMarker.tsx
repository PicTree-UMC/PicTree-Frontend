/**
 * 저장된 위치에 심기는 나무 마커.
 * 말풍선 라벨(이모지+장소명)이 나무 위에 뜨고, 꼬리가 나무를 정확히 가리킨다.
 */
interface TreeMarkerProps {
  emoji: string;
  label: string;
}

export function TreeMarker({ emoji, label }: TreeMarkerProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center gap-1.5 whitespace-nowrap rounded-full border border-pictree-500 bg-white px-3 py-1.5 shadow-sm">
        <span className="text-xs">{emoji}</span>
        <span className="text-xs font-medium text-neutral-800">{label}</span>
        {/* 말풍선 꼬리 */}
        <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-pictree-500 bg-white" />
      </div>
      <img src="/markers/tree.svg" alt="" className="mt-1.5 h-[34px] w-[34px]" />
    </div>
  );
}
