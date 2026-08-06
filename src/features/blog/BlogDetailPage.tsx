import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getAIBlogDraftDetail } from './api/blogApi';
import { getMyBlogPlaces } from './api/blogPlacesApi';
import { formatDateRange, formatLongDate } from './lib/formatBlogDate';

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const numericDraftId = Number(draftId);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['blog-drafts', 'detail', numericDraftId],
    queryFn: async () => {
      const [draft, trees] = await Promise.all([
        getAIBlogDraftDetail(undefined, numericDraftId),
        getMyBlogPlaces().catch(() => []),
      ]);

      return {
        ...draft,
        items: draft.items.map((item) => ({
          ...item,
          image: trees.find((tree) => tree.name === item.placeName)?.defaultImage ?? '',
        })),
      };
    },
    enabled: Number.isInteger(numericDraftId) && numericDraftId > 0,
  });

  return (
    <main className="min-h-full bg-[#fffcef] text-[#252b24]">
      <header className="sticky top-0 z-10 flex h-[calc(env(safe-area-inset-top)+56px)] items-end border-b border-[#ececdf] bg-[#fffcef]/95 px-4 pb-2 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="블로그 목록으로 돌아가기"
          className="grid size-10 place-items-center rounded-full active:bg-black/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="pb-2 text-[16px] font-bold">블로그</span>
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
              <section key={`${item.placeName}-${index}`} className={index > 0 ? 'mt-14' : undefined}>
                <h2 className="text-[20px] font-bold leading-[1.5] text-[#202520]">
                  {index + 1}. {item.placeName}
                </h2>
                {item.image && (
                  <figure className="mt-5 overflow-hidden bg-[#f1f3eb]">
                    <img src={item.image} alt={`${item.placeName}에서 촬영한 사진`} className="max-h-[560px] w-full object-cover" />
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
    </main>
  );
}
