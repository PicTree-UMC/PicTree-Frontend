import treeIcon from "../assets/icons/tree.svg";

interface NearbyTreeAlertProps {
  placeName?: string; 
  distanceM?: number; 
  onView?: () => void; 
}

export function NearbyTreeAlert({
  placeName = "오아시스 만난 곳",
  distanceM = 120,
  onView,
}: NearbyTreeAlertProps) {
  return (
    <div className="flex h-[109px] w-[360px] items-center gap-3 rounded-[20px] bg-[#F9F9F9] px-3 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)]">
      <span className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full bg-[#F6F0D7]">
        <img src={treeIcon} alt="" className="h-9 w-9" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-[#292929]">
          근처에 심어둔 나무가 있어요
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#787878]">
          {placeName} · 약 {distanceM}m
        </p>
        <p className="mt-1 text-xs text-[#2C3930]">지난 기록을 열어볼까요?</p>
      </div>
      <button
        type="button"
        onClick={onView}
        className="h-8 w-[61px] flex-shrink-0 rounded-xl bg-[#C5D89D] text-sm font-bold text-[#2C3930]"
      >
        보기
      </button>
    </div>
  );
}
