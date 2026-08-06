import { useNavigate } from 'react-router-dom';
import type { SavedBlog } from '../types/blog';
import { formatDateRange, formatLongDate } from '../lib/formatBlogDate';
import { blogDetailPath } from '@/shared/constants/routes';

type SavedBlogCardProps = {
  blog: SavedBlog;
};

export function SavedBlogCard({ blog }: SavedBlogCardProps) {
  const navigate = useNavigate();

  return (
    <article className="border-b border-[#ececdf] py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3.5 rounded-xl text-left transition active:bg-[#faf9f2]"
        onClick={() => navigate(blogDetailPath(blog.id))}
        aria-label={`${blog.title} 상세 보기`}
      >
        <span className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-xl bg-[#ecf6d8] text-[#788f4a]" aria-hidden>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
        </span>

        <span className="flex min-w-0 flex-1 flex-col self-stretch py-1">
          <span className="overflow-hidden text-[16px] font-bold leading-[1.45] text-[#2c3930] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {blog.title}
          </span>
          <span className="mt-2 text-[13px] text-[#737970]">
            {formatDateRange(blog.startDate, blog.endDate, true)}
          </span>
          <span className="mt-auto text-[12px] text-[#a3a89a]">
            <time dateTime={blog.savedAt}>{formatLongDate(blog.savedAt.slice(0, 10))} 작성</time>
          </span>
        </span>

        <svg className="mr-1 shrink-0 text-[#b5b9af]" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m1 1 6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}
