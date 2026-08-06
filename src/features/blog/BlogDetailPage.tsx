import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAIBlogDraftDetail } from './api/blogApi';
import { formatDateRange, formatLongDate } from './lib/formatBlogDate';
import { DeleteDraftModal } from './components/DeleteDraftModal';
import { useBlogDraftStore } from './store/blogDraftStore';
import { NavBar } from '@/shared/components';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';
import { useBlogTrees } from './hooks/useBlogTrees';
import { formatKoreanDate } from '@/shared/lib/date';

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const numericDraftId = Number(draftId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteBlog = useBlogDraftStore((state) => state.deleteBlogAsync);
  const { showToast } = useToast();
  const { data: trees } = useBlogTrees();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['blog-drafts', 'detail', numericDraftId],
    queryFn: () => getAIBlogDraftDetail(undefined, numericDraftId),
    enabled: Number.isInteger(numericDraftId) && numericDraftId > 0,
  });

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteBlog(numericDraftId);
      showToast('블로그 초안을 삭제했어요', 'success');
      navigate(ROUTES.blog, { replace: true });
    } catch (error) {
      console.error('delete draft failed', error);
      showToast('블로그 초안 삭제에 실패했어요', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-full bg-[#fffcef] text-[#252b24]">
      {/* px-4 였는데 본문(px-5)과도, 다른 화면 헤더(px-5)와도 어긋나 있었다.
          높이를 고정하고 items-end 로 내용을 아래에 붙이던 것도 pt-header 로 바꿨다 —
          안전영역을 헤더 높이에 섞어 두면 다른 화면과 같은 값인지 눈으로 알 수 없다. */}
      <header className="sticky top-0 z-10 border-b border-[#ececdf] bg-[#fffcef]/95 px-5 pb-3 pt-header backdrop-blur-sm">
        <NavBar
          className="w-full"
          onBack={() => navigate(-1)}
          backLabel="블로그 목록으로 돌아가기"
          title="블로그"
          action={
            data && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label="블로그 초안 삭제"
                className="grid size-10 place-items-center rounded-full text-[#dc2626] active:bg-red-50"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </button>
            )
          }
        />
      </header>

      {isPending && (
        <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="블로그를 불러오는 중">
          <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#788f4a]" />
        </div>
      )}

      {isError && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-[15px] text-[#60655c]">블로그를 불러오지 못했어요.</p>
          <button type="button" onClick={() => refetch()} className="mt-4 rounded-xl bg-[#5b6b38] px-5 py-3 text-[14px] font-medium text-white">
            다시 시도
          </button>
        </div>
      )}

      {data && (
        <article className="mx-auto w-full max-w-[680px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-8">
          <header className="border-b border-[#eeeeea] pb-6">
            <p className="text-[13px] font-medium text-[#6f8542]">여행 기록</p>
            <h1 className="mt-2 text-[25px] font-bold leading-[1.45] tracking-[-0.025em] text-[#1f241f]">
              {data.title}
            </h1>
            <p className="mt-4 text-[13px] text-[#777d74]">
              {formatDateRange(data.startDate, data.endDate, true)}
            </p>
            <time className="mt-1 block text-[12px] text-[#a2a69f]" dateTime={data.createdAt}>
              {formatLongDate(data.createdAt.slice(0, 10))} 작성
            </time>
          </header>

          <div className="pb-4 pt-8">
            {data.items.map((item, index) => (
              <section key={item.treeId} className={index > 0 ? 'mt-14' : undefined}>
                <h2 className="text-[20px] font-bold leading-[1.5] text-[#202520]">
                  {index + 1}. {item.placeName}
                </h2>
                {item.imageUrl && (
                  <figure className="mt-5">
                    <img src={item.imageUrl} alt={`${item.placeName}에서 촬영한 사진`} className="max-h-[560px] w-full bg-[#f1f3eb] object-cover" />
                    {(() => {
                      const recordedAt = trees?.find((tree) => tree.treeId === item.treeId)?.createdAt;
                      const label = formatKoreanDate(recordedAt);
                      return label ? (
                        <figcaption className="mt-2 flex items-center justify-end gap-1 text-[12px] text-[#9a9f97]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 11h18" />
                          </svg>
                          {label} 촬영
                        </figcaption>
                      ) : null;
                    })()}
                  </figure>
                )}
                <p className="mt-5 whitespace-pre-line text-[16px] leading-[2] tracking-[-0.01em] text-[#3f453e]">
                  {item.content}
                </p>
              </section>
            ))}
          </div>
        </article>
      )}

      <DeleteDraftModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}
