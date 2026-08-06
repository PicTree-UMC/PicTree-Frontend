import { useState } from 'react';
import type { SavedBlog } from '../types/blog';
import { formatLongDate } from '../lib/formatBlogDate';
import { BlogPlacesSheet } from './BlogPlacesSheet';

type SavedBlogCardProps = {
  blog: SavedBlog;
};

export function SavedBlogCard({ blog }: SavedBlogCardProps) {
  const [placesOpen, setPlacesOpen] = useState(false);
  const cover = blog.sections[0];
  const preview = blog.sections.map((section) => section.body).join(' ');

  return (
    <article className="border-b border-[#ececdf] py-5">
      {/* 제목 · 본문 미리보기 · 썸네일 */}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold text-[#2c3930]">{blog.title}</h2>
          <p className="mt-1.5 overflow-hidden text-[13px] leading-[1.6] text-[#60655c] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{preview}</p>
        </div>
        {cover && (
          <div className="w-[92px] shrink-0 overflow-hidden rounded-lg">
            <img src={cover.image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* 장소 개수 · 작성일 */}
      <div className="mt-3 flex items-center gap-3 text-[13px] text-[#60655c]">
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-pictree-300 py-1 pl-2.5 pr-2 text-[13px] font-bold text-pictree-700 transition active:scale-95"
          onClick={() => setPlacesOpen(true)}
          aria-label={`방문한 장소 ${blog.sections.length}곳 보기`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>
          {blog.sections.length}개 장소
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
        </button>
        <span className="flex items-center gap-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <time dateTime={blog.savedAt}>{formatLongDate(blog.savedAt)}</time>
        </span>
      </div>

      {placesOpen && <BlogPlacesSheet sections={blog.sections} onClose={() => setPlacesOpen(false)} />}
    </article>
  );
}
