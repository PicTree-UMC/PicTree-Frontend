import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components/toast/toastStore';
import { useBlogCreate } from './hooks/useBlogCreate';
import { useBlogDraftStore } from './store/blogDraftStore';
import { CreateStepHeader } from './components/CreateStepHeader';
import { RouteStep } from './components/steps/RouteStep';
import { ToneStep } from './components/steps/ToneStep';
import { ResultStep } from './components/steps/ResultStep';
import { useMySubscription } from '../premium/hooks/useMySubscription';

/**
 * 동선 페이지의 "AI 블로그 작성"에서 넘어올 때 전달되는 프리필.
 *
 * ⚠️ 전에는 그 동선의 방문 기간(`startDate`·`endDate`)을 넘겼다. 초안 입력이 기간이었기
 * 때문인데, 이제 입력 단위가 동선 자체라 **동선 id 하나면 된다**(이슈 #212). 기간은 작성
 * 화면이 동선 상세에서 도로 뽑는다 — 넘겨받은 기간과 동선의 실제 날짜가 어긋날 일이 없어진다.
 */
type BlogCreateLocationState = { routeId?: number } | null | undefined;

function BlogCreateContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const saveDraft = useBlogDraftStore((state) => state.saveDraft);
  const locationState = location.state as BlogCreateLocationState;
  const flow = useBlogCreate({ initialRouteId: locationState?.routeId });

  const handleBack = () => {
    if (flow.step === 1) {
      navigate(ROUTES.blog);
      return;
    }
    flow.back();
  };

  const handleSave = async () => {
    if (!flow.draft) return;

    try {
      await saveDraft({
        title: flow.draft.title,
        days: flow.draft.days.map((day) => ({
          date: day.date,
          items: day.sections.map((section) => ({
            treeId: section.treeId,
            imageUrl: section.image || null,
            placeName: section.heading,
            content: section.body,
          })),
        })),
        startDate: flow.startDate,
        endDate: flow.endDate,
      });
      showToast('블로그를 저장했어요', 'success');
      navigate(ROUTES.blog);
    } catch (error) {
      console.error('save draft failed', error);
      showToast('블로그 저장에 실패했어요', 'error');
    }
  };

  return (
    // min-h-full: 뷰포트 단위를 아는 곳은 셸(styles.css) 하나다.
    <main className="flex min-h-full flex-col bg-[#fffcef] text-[#2c3930]">
      <CreateStepHeader step={flow.step} onBack={handleBack} />
      <div className="flex flex-1 flex-col">
        {flow.step === 1 && (
          <RouteStep
            routes={flow.routes}
            isPending={flow.isRoutesPending}
            isError={flow.isRoutesError}
            onRetry={flow.refetchRoutes}
            selectedRouteId={flow.selectedRouteId}
            onSelect={flow.selectRoute}
            isDetailPending={flow.isRouteDetailPending}
            isDetailError={flow.isRouteDetailError}
            treeCount={flow.treeIds.length}
            canGoNext={flow.canGoToTone}
            onNext={flow.goToTone}
            onCreateRoute={() => navigate(ROUTES.journey)}
          />
        )}
        {flow.step === 2 && (
          <ToneStep toneId={flow.toneId} onSelect={flow.setToneId} onNext={flow.goToResult} />
        )}
        {flow.step === 3 && (
          <ResultStep
            status={flow.status}
            errorMessage={flow.errorMessage}
            draft={flow.draft}
            onSave={handleSave}
            onRetry={flow.retryGenerate}
            onBack={flow.back}
          />
        )}
      </div>
    </main>
  );
}

/** 무료 사용자의 URL 직접 진입까지 막는 AI 블로그 작성 권한 경계. */
export function BlogCreatePage() {
  const { data: subscription, isPending, isError, refetch } = useMySubscription();

  if (isPending) {
    return (
      <main className="grid min-h-full place-items-center bg-[#fffcef]" role="status" aria-label="구독 정보를 확인하는 중">
        <div className="size-8 animate-spin rounded-full border-[3px] border-[#c5d89d] border-t-[#788f4a]" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center bg-[#fffcef] px-5 text-center">
        <p className="text-[15px] text-[#60655c]">구독 정보를 확인하지 못했어요.</p>
        <button type="button" onClick={() => refetch()} className="mt-4 rounded-xl bg-pictree-700 px-5 py-3 text-[15px] font-medium text-white">
          다시 시도
        </button>
      </main>
    );
  }

  if (!subscription) {
    return <Navigate to={ROUTES.premium} replace />;
  }

  return <BlogCreateContent />;
}
