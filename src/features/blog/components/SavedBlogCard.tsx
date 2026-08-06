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
    <article className="border-b border-[#ececdf] py-4 active:bg-[#faf9f2]">
      {/* 제목 · 본문 미리보기 · 썸네일: 모바일 네이버 블로그 목록 카드 레이아웃 */}
      <div className="flex gap-3.5">
        {cover ? (
          <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-[#ecf6d8]">
            <img src={cover.image} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-[88px] w-[88px] shrink-0 rounded-xl bg-[#ecf6d8]" aria-hidden />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[15px] font-bold leading-tight text-[#2c3930]">{blog.title}</h2>
          <p className="mt-1.5 overflow-hidden text-[13px] leading-[1.55] text-[#8b9086] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {preview}
          </p>

          {/* 장소 개수 · 작성일: 하단 메타 라인 */}
          <div className="mt-auto flex items-center gap-2.5 pt-2 text-[12px] text-[#a3a89a]">
            <button
              type="button"
              className="flex items-center gap-0.5 font-medium text-[#5b6b38] transition active:opacity-70"
              onClick={() => setPlacesOpen(true)}
              aria-label={`방문한 장소 ${blog.sections.length}곳 보기`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>
              {blog.sections.length}개 장소
            </button>
            <span aria-hidden className="text-[#e0e2d8]">·</span>
            <time dateTime={blog.savedAt}>{formatLongDate(blog.savedAt)}</time>
          </div>
        </div>
      </div>

      {placesOpen && <BlogPlacesSheet sections={blog.sections} onClose={() => setPlacesOpen(false)} />}
    </article>
  );
}
