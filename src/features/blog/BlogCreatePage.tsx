import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { useToast } from '../../shared/components/toast/toastStore';
import { useBlogCreate } from './hooks/useBlogCreate';
import { useBlogDraftStore } from './store/blogDraftStore';
import { CreateStepHeader } from './components/CreateStepHeader';
import { DateStep } from './components/steps/DateStep';
import { ToneStep } from './components/steps/ToneStep';
import { ResultStep } from './components/steps/ResultStep';

/** 동선 페이지의 "AI 블로그 작성"에서 넘어올 때 전달되는 기간 프리필. */
type BlogCreateLocationState = { startDate?: string; endDate?: string } | null | undefined;

export function BlogCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const saveDraft = useBlogDraftStore((state) => state.saveDraft);
  const locationState = location.state as BlogCreateLocationState;
  const flow = useBlogCreate({
    initialStartDate: locationState?.startDate,
    initialEndDate: locationState?.endDate,
  });

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
          <DateStep
            startDate={flow.startDate}
            endDate={flow.endDate}
            trees={flow.trees}
            selectedTreeIds={flow.selectedTreeIds}
            onToggleTree={flow.toggleTree}
            activityByDate={flow.activityByDate}
            onDateRangeChange={flow.setDateRange}
            onNext={flow.goToTone}
          />
        )}
        {flow.step === 2 && (
          <ToneStep toneId={flow.toneId} onSelect={flow.setToneId} onNext={flow.goToResult} />
        )}
        {flow.step === 3 && (
          <ResultStep status={flow.status} draft={flow.draft} onSave={handleSave} />
        )}
      </div>
    </main>
  );
}
