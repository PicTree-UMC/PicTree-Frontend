type BlogHeaderProps = {
  isPremium: boolean;
  onUpgrade: () => void;
};

export function BlogHeader({ isPremium, onUpgrade }: BlogHeaderProps) {
  return (
    <header className="bg-[#c9dfa0] px-[30px] pb-5 pt-[68px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold leading-7">AI 블로그 작성</h1>
          <p className="text-[15px] font-medium">사진/기록으로 초안을 자동 생성해요</p>
        </div>
        <button className="rounded-[14px] bg-[#e7c568] px-4 py-[10px] text-[13px] font-medium text-[#34402c]" onClick={isPremium ? undefined : onUpgrade}>
          {isPremium ? '연간 프리미엄' : '업그레이드'}
        </button>
      </div>
    </header>
  );
}
