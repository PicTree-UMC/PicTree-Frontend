import { useBlogDraftStore } from './store/blogDraftStore';
import { BlogCreateFab } from './components/BlogCreateFab';
import { BlogEmptyState } from './components/BlogEmptyState';
import { SavedBlogCard } from './components/SavedBlogCard';
import { useEffect } from 'react';
import { useBlogTrees } from './hooks/useBlogTrees';
import { getLocalDateString } from '@/shared/lib/date';

export function BlogPage() {
  const savedBlogs = useBlogDraftStore((state) => state.savedBlogs);
  const isLoading = useBlogDraftStore((state) => state.isLoading);
  const fetchError = useBlogDraftStore((state) => state.fetchError);
  const fetchSavedBlogs = useBlogDraftStore((state) => state.fetchSavedBlogs);
  const { data: trees } = useBlogTrees();

  useEffect(() => {
    fetchSavedBlogs();
  }, [fetchSavedBlogs]);

  return (
    // pb: 탭바가 콘텐츠 위에 얹히므로 마지막 카드가 가려지지 않을 만큼 띄운다
    <main className="min-h-full w-full bg-[#fffcef] pb-nav text-[#2c3930]">
      {/* 상단 여백은 노치(safe-area) + 0.75rem 로 계산한다. 고정 px(pt-[68px])는
          safe-area 가 작은 기기에서 과하게 떠 보였다. AuthShell·CameraPage 와 같은 값. */}
      {/* 제목 밑 구분선은 뺐다 — 다른 탭(타임라인·동선) 머리글엔 선이 없다. */}
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1 className="text-[20px] font-medium">블로그</h1>
        {savedBlogs.length > 0 && (
          <p className="mt-0.5 text-[13px] text-[#8b9086]">전체 {savedBlogs.length}개</p>
        )}
      </header>

      {isLoading ? (
        <div className="grid min-h-[55vh] place-items-center" role="status" aria-label="블로그 목록을 불러오는 중">
          <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#788f4a]" />
        </div>
      ) : fetchError ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-[15px] text-[#60655c]">블로그 목록을 불러오지 못했어요.</p>
          <button type="button" onClick={fetchSavedBlogs} className="mt-4 rounded-xl bg-[#5b6b38] px-5 py-3 text-[14px] font-medium text-white">
            다시 시도
          </button>
        </div>
      ) : savedBlogs.length > 0 ? (
        <section className="flex flex-col px-5">
          {savedBlogs.map((blog) => (
            <SavedBlogCard
              key={blog.id}
              blog={blog}
              treeCount={trees?.filter((tree) => {
                const recordedDate = getLocalDateString(new Date(tree.createdAt));
                return recordedDate >= blog.startDate && recordedDate <= blog.endDate;
              }).length}
            />
          ))}
        </section>
      ) : (
        <BlogEmptyState />
      )}

      <BlogCreateFab />
    </main>
  );
}
