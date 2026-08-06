import { useNavigate } from 'react-router-dom';
import type { SavedBlog } from '../types/blog';
import { formatDateRange } from '../lib/formatBlogDate';
import { blogDetailPath } from '@/shared/constants/routes';

type SavedBlogCardProps = {
  blog: SavedBlog;
  treeCount?: number;
};

export function SavedBlogCard({ blog, treeCount }: SavedBlogCardProps) {
  const navigate = useNavigate();

  return (
    <article className="border-b border-[#ececdf] py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3.5 rounded-xl text-left transition active:bg-[#faf9f2]"
        onClick={() => navigate(blogDetailPath(blog.id))}
        aria-label={`${blog.title} 상세 보기`}
      >
        {blog.thumbnailUrl ? (
          <img
            src={blog.thumbnailUrl}
            alt=""
            className="h-[88px] w-[88px] shrink-0 rounded-xl bg-pictree-100 object-cover"
          />
        ) : (
          <span className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-xl bg-pictree-100 text-pictree-500" aria-hidden>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col self-stretch py-1">
          <span className="overflow-hidden text-base font-medium leading-[1.45] text-[#2c3930] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {blog.title}
          </span>
          <span className="mt-2 text-[13px] text-[#737970]">
            {formatDateRange(blog.startDate, blog.endDate, true)}
          </span>
          <span className="mt-auto flex items-center gap-1 text-[12px] font-medium text-pictree-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2" />
            </svg>
            {treeCount != null ? `나무 ${treeCount}개` : '나무 확인 중'}
          </span>
        </span>

        <svg className="mr-1 shrink-0 text-[#b5b9af]" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m1 1 6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}
