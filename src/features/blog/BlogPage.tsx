import { useBlogDraftStore } from './store/blogDraftStore';
import { BlogCreateFab } from './components/BlogCreateFab';
import { BlogEmptyState } from './components/BlogEmptyState';
import { SavedBlogCard } from './components/SavedBlogCard';
import { useEffect } from 'react';

export function BlogPage() {
  const savedBlogs = useBlogDraftStore((state) => state.savedBlogs);
  const fetchSavedBlogs = useBlogDraftStore((state) => state.fetchSavedBlogs);

  useEffect(() => {
    fetchSavedBlogs();
  }, [fetchSavedBlogs]);

  return (
    // pb: 탭바가 콘텐츠 위에 얹히므로 마지막 카드가 가려지지 않을 만큼 띄운다
    <main className="min-h-full w-full bg-[#fffcef] pb-nav text-[#2c3930]">
      {/* 상단 여백은 노치(safe-area) + 0.75rem 로 계산한다. 고정 px(pt-[68px])는
          safe-area 가 작은 기기에서 과하게 떠 보였다. AuthShell·CameraPage 와 같은 값. */}
      <header className="px-5 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1 className="text-[22px] font-bold">블로그</h1>
      </header>

      {savedBlogs.length > 0 ? (
        <section className="flex flex-col px-5 pt-1">
          {savedBlogs.map((blog) => (
            <SavedBlogCard key={blog.id} blog={blog} />
          ))}
        </section>
      ) : (
        <BlogEmptyState />
      )}

      <BlogCreateFab />
    </main>
  );
}
