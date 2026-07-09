/**
 * 무료 플랜 제한 안내 배너 
 * 노출 여부(plan === 'free')는 부모(TimelinePage)에서 결정.
 * 색상은 Figma 값: 회색 pill #EDEDED / 텍스트 #4F4F4F.
 */
export default function FreePlanBanner() {
  return (
    <div className="px-4 py-2">
      <div className="rounded-full bg-[#EDEDED] px-4 py-1.5 text-center text-[11px] text-[#4F4F4F]">
        무료 플랜은 최근 3일치까지 볼 수 있어요
      </div>
    </div>
  );
}
