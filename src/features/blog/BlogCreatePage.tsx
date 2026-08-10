import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components/toast/toastStore';
import { useBlogCreate } from './hooks/useBlogCreate';
import { useSaveBlogDraft } from './hooks/useBlogDrafts';
import { CreateStepHeader } from './components/CreateStepHeader';
import { RouteStep } from './components/steps/RouteStep';
import { ToneStep } from './components/steps/ToneStep';
import { ResultStep } from './components/steps/ResultStep';
import { useBlogDraftUsage } from './hooks/useBlogDraftUsage';

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
  const { mutateAsync: saveDraft } = useSaveBlogDraft();
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
    <main className="flex min-h-full flex-col bg-cream text-ink">
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

/**
 * URL 직접 진입까지 막는 AI 블로그 작성 권한 경계.
 *
 * ⚠️ **구독 여부로 막지 않는다.** 종전엔 `!subscription` 이면 `/premium` 으로 돌려보냈는데,
 * 무료 플랜도 PICTREE 토큰을 월 1개 받으므로(`/premium` 비교표 · 서버 `BLOG_DRAFT_LIMIT`
 * 의 FREE 1) 구독이 없다는 게 못 쓴다는 뜻이 아니었다. 무료 사용자는 받은 1개를 쓸 길이
 * 아예 없었다.
 *
 * 막을 사유는 **이번 주기 잔량이 0 인 것** 하나다.
 */
export function BlogCreatePage() {
  const { data: usage, isPending } = useBlogDraftUsage();

  if (isPending) {
    return (
      <main className="grid min-h-full place-items-center bg-cream" role="status" aria-label="PICTREE 토큰 잔량을 확인하는 중">
        <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
      </main>
    );
  }

  /*
    ⚠️ 조회 실패(`usage === undefined`)는 통과시킨다 — 잔량을 **모르는 것**이지 0 이 아니다.
    여기서 막으면 아직 쓸 수 있는 사람이 재시도 화면에 갇히는데, 정작 한도 판정은 생성 요청
    시점에 서버가 다시 한다. 종전의 '구독 정보를 확인하지 못했어요' 재시도 화면을 뺀 이유다.
  */
  if (usage?.remainingCount === 0) {
    return <Navigate to={ROUTES.premium} replace />;
  }

  return <BlogCreateContent />;
}
