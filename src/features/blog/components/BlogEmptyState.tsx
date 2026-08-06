import { EmptyBlogIcon } from './icons';

export function BlogEmptyState() {
  return (
    <div className="flex flex-col items-center px-8 pt-[24vh] text-center">
      <EmptyBlogIcon />
      <h2 className="mt-5 text-[17px] font-medium text-[#2c3930]">아직 작성한 블로그가 없어요</h2>
      <p className="mt-2 text-[15px] leading-6 text-[#60655c]">
        여행 기록으로 블로그 초안을 만들어보세요.
        <br />
        우측 하단 버튼으로 시작할 수 있어요.
      </p>
    </div>
  );
}
