import footprintIcon from "../assets/icons/footprint.svg";

interface RouteFootprintBannerProps {
  placeCount?: number;
  onViewRoute?: () => void; 
}

export function RouteFootprintBanner({
  placeCount = 0,
  onViewRoute,
}: RouteFootprintBannerProps) {
  return (
    <div className="flex h-[74px] w-[350px] items-center gap-[15px] rounded-[20px] bg-[rgba(197,216,157,0.5)] px-5">
      <img src={footprintIcon} alt="" className="h-9 w-9 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-[#2C3930]">나의 여행 발자국</p>
        <p className="text-sm font-semibold text-[#2C3930]">
          {placeCount}개의 장소를 기록했어요
        </p>
      </div>
      <button
        type="button"
        onClick={onViewRoute}
        className="h-[39px] w-20 flex-shrink-0 rounded-xl bg-[#ABC582] text-sm font-bold text-[#2C3930]"
      >
        동선보기
      </button>
    </div>
  );
}
