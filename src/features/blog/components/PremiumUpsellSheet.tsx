import { CheckIcon, CrownIcon } from './icons';

type PremiumUpsellSheetProps = {
  onClose: () => void;
  onUpgrade: () => void;
};

const BENEFITS = [
  ['용량 업그레이드', '1GB/5GB/20GB'],
  ['AI 블로그 자동 생성', '월 5회/20회/50회'],
  ['광고 제거', '광고 없음'],
] as const;

export function PremiumUpsellSheet({ onClose, onUpgrade }: PremiumUpsellSheetProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50" role="presentation" onClick={onClose}>
      <section
        className="absolute inset-x-0 bottom-0 mx-auto w-full rounded-t-[22px] bg-[#fffdf4] px-5 pb-6 pt-9 sm:max-w-[390px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upsell-title"
        onClick={(event) => event.stopPropagation()}
      >
        <i className="absolute left-1/2 top-2 h-1 w-[132px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex justify-center text-[#30402e]"><CrownIcon large /></div>
        <h2 id="premium-upsell-title" className="mt-3 text-center text-[21px] font-bold">프리미엄 기능이에요</h2>
        <p className="mt-2 text-center text-[14px] leading-5 text-[#34402c]">AI 블로그 자동 작성과 무제한 동선 저장은<br />프리미엄 플랜에서 이용 가능해요</p>

        <div className="mt-5 rounded-xl border-2 border-[#bed793] bg-white px-5 py-2">
          {BENEFITS.map(([title, detail]) => (
            <div key={title} className="flex min-h-[62px] items-center gap-3">
              <span className="text-[22px]" aria-hidden>{title === '용량 업그레이드' ? '☁' : title === 'AI 블로그 자동 생성' ? '▣' : 'A̸D̸S̸'}</span>
              <span className="flex-1"><strong className="block text-[16px]">{title}</strong><small className="text-[11px] text-[#999]">{detail}</small></span>
              <CheckIcon />
            </div>
          ))}
        </div>

        <button className="mt-4 h-[62px] w-full rounded-xl bg-[#879b54] text-[16px] font-bold text-white shadow-lg" onClick={onUpgrade}>프리미엄으로 글 작성하기</button>
        <button className="mt-3 w-full py-1 text-[12px] text-[#999]" onClick={onClose}>나중에 할게요</button>
      </section>
    </div>
  );
}
