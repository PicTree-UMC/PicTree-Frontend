import { useBlogDraftStore } from './store/blogDraftStore';
import { BlogCreateFab } from './components/BlogCreateFab';
import { BlogEmptyState } from './components/BlogEmptyState';
import { SavedBlogCard } from './components/SavedBlogCard';

export function BlogPage() {
  const savedBlogs = useBlogDraftStore((state) => state.savedBlogs);

  return (
    // pb: 탭바가 콘텐츠 위에 얹히므로 마지막 카드가 가려지지 않을 만큼 띄운다
    <main className="min-h-full w-full bg-[#fffcef] pb-28 text-[#20251f]">
      <header className="px-5 pb-2 pt-[68px]">
        <h1 className="text-[22px] font-bold">블로그</h1>
      </header>

      {savedBlogs.length > 0 ? (
        <section className="flex flex-col px-5 pb-[140px] pt-1">
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
