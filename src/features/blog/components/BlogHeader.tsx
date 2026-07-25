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
        <button className="min-w-[92px] rounded-[13px] bg-[#60762d] px-4 py-[10px] text-[13px] font-bold text-white" onClick={isPremium ? undefined : onUpgrade}>
          {isPremium ? '맥스' : '업그레이드'}
        </button>
      </div>
    </header>
  );
}
