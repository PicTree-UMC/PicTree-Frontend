import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDateRange, formatLongDate } from './lib/formatBlogDate';
import { useBlogDraftDetail, useDeleteBlogDraft } from './hooks/useBlogDrafts';
import { NavBar, Photo } from '@/shared/components';
import { useToast } from '@/shared/components/toast/toastStore';
import { ROUTES } from '@/shared/constants/routes';
import { DeleteConfirmModal, DeleteIconButton } from '@/shared/components/DeleteConfirmModal';

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const numericDraftId = Number(draftId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: deleteBlog } = useDeleteBlogDraft();
  const { showToast } = useToast();

  // 인라인 useQuery 였다. 키를 훅으로 옮겨 목록·상세가 같은 네임스페이스를 공유한다.
  const { data, isPending, isError, refetch } = useBlogDraftDetail(numericDraftId);

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
    <main className="min-h-full bg-cream text-[#252b24]">
      {/* px-4 였는데 본문(px-5)과도, 다른 화면 헤더(px-5)와도 어긋나 있었다.
          높이를 고정하고 items-end 로 내용을 아래에 붙이던 것도 pt-header 로 바꿨다 —
          안전영역을 헤더 높이에 섞어 두면 다른 화면과 같은 값인지 눈으로 알 수 없다. */}
      <header className="sticky top-0 z-10 border-b border-[#ececdf] bg-cream/95 px-5 pb-3 pt-header backdrop-blur-sm">
        <NavBar
          className="w-full"
          onBack={() => navigate(-1)}
          backLabel="블로그 목록으로 돌아가기"
          title="블로그"
          action={
            data && (
              <DeleteIconButton
                label="블로그 초안 삭제"
                onClick={() => setDeleteOpen(true)}
              />
            )
          }
        />
      </header>

      {isPending && (
        <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="블로그를 불러오는 중">
          <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
        </div>
      )}

      {isError && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-[15px] text-ink-muted">블로그를 불러오지 못했어요.</p>
          <button type="button" onClick={() => refetch()} className="mt-4 rounded-xl bg-pictree-700 px-5 py-3 text-[15px] font-medium text-white">
            다시 시도
          </button>
        </div>
      )}

      {data && (
        <article className="mx-auto w-full max-w-[680px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-8">
          <header className="border-b border-[#eeeeea] pb-6">
            <p className="text-[13px] font-medium text-pictree-700">여행 기록</p>
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

          <div className="pb-4 pt-4">
            {data.days.map((day, dayIndex) => (
              <section key={day.date} className={dayIndex > 0 ? 'mt-16 border-t border-[#eeeeea] pt-12' : 'pt-8'}>
                <h2 className="text-center text-[20px] font-bold tracking-[-0.015em] text-[#202520]">
                  {formatLongDate(day.date)}
                </h2>
                <div className="mt-8">
                  {day.items.map((item, itemIndex) => (
                    <article key={`${item.treeId}-${itemIndex}`} className={itemIndex > 0 ? 'mt-14' : undefined}>
                      {/* 못 불러온 사진은 안 그린다 — 근거는 `ResultStep` 의 같은 자리 주석(#214). */}
                      {item.imageUrl && (
                        <figure>
                          <Photo src={item.imageUrl} alt={`${item.placeName}에서 촬영한 사진`} className="max-h-[560px] w-full bg-[#f1f3eb] object-cover" fallback={null} />
                        </figure>
                      )}
                      <h3 className={`${item.imageUrl ? 'mt-5' : ''} text-[19px] font-bold leading-[1.5] text-[#202520]`}>
                        {item.placeName}
                      </h3>
                      <p className="mt-3 whitespace-pre-line text-[16px] leading-[2] tracking-[-0.01em] text-[#3f453e]">
                        {item.content}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      )}

      <DeleteConfirmModal
        isOpen={deleteOpen}
        title="이 초안을 삭제할까요?"
        description="삭제한 초안은 다시 되돌릴 수 없어요."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}
