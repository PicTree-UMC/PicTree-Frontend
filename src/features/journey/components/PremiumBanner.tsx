/** 왕관 아이콘(디자인 material-symbols:crown-rounded). 인라인 SVG 로 렌더. */
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 7.5 6.5 11l3.6-4.8a1.7 1.7 0 0 1 2.8 0L16.5 11 20 7.5c.9-.9 2.4-.1 2.2 1.1l-1.6 9A1.7 1.7 0 0 1 18.9 19H5.1a1.7 1.7 0 0 1-1.7-1.4l-1.6-9C.6 7.4 2.1 6.6 3 7.5Z" />
    </svg>
  );
}

interface PremiumBannerProps {
  onUpgrade?: () => void;
}

/**
 * 프리미엄 안내 배너. 헤더(세이지 밴드) 안에 놓인다.
 * 업그레이드 이동(/premium)은 아직 라우트가 없어 비워둔다.
 */
export function PremiumBanner({ onUpgrade }: PremiumBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[#ecf6d8]/80 px-4 py-2.5 shadow-[0px_4px_12px_rgba(0,0,0,0.12)]">
      <CrownIcon className="h-[30px] w-[30px] shrink-0 text-[#2c3930]" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-[#111]">프리미엄 기능</p>
        <p className="truncate text-[11px] font-medium text-[#111]">
          사진 저장 용량 1GB부터 + AI 블로그 작성
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="shrink-0 rounded-[12px] bg-[#5c6f2b] px-3.5 py-1.5 text-sm font-semibold text-white"
      >
        업그레이드
      </button>
    </div>
  );
}
