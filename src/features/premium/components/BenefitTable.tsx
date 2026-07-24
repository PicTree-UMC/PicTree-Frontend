const BENEFITS = [['동선 저장', '5개 제한', '무제한'], ['AI 블로그 자동 생성', '사용불가', '무제한'], ['광고 제거', '광고 포함', '광고 없음']] as const;

export function BenefitTable() {
  return (
    <div className="mt-7 rounded-xl bg-white px-[22px] py-[18px] shadow-sm">
      <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-[#859754] pb-4 text-[14px] font-bold"><span>혜택 비교</span><span className="text-center">무료</span><span className="text-right">프리미엄</span></div>
      {BENEFITS.map(([benefit, free, premium]) => <div key={benefit} className="grid grid-cols-[1.5fr_1fr_1fr] py-[13px] text-[15px] font-bold"><span>{benefit}</span><span className="text-center text-[12px] font-medium text-[#999]">{free}</span><span className="text-right text-[#66802f]">{premium}</span></div>)}
    </div>
  );
}
