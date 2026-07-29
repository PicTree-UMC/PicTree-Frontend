import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { getLocalDateString } from '../../shared/lib/date';
import { useToast } from '../../shared/components/toast/toastStore';
import { useBlogCreate } from './hooks/useBlogCreate';
import { useBlogDraftStore } from './store/blogDraftStore';
import { CreateStepHeader } from './components/CreateStepHeader';
import { DateStep } from './components/steps/DateStep';
import { ToneStep } from './components/steps/ToneStep';
import { ResultStep } from './components/steps/ResultStep';

export function BlogCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addBlog = useBlogDraftStore((state) => state.addBlog);
  const flow = useBlogCreate();

  const handleBack = () => {
    if (flow.step === 1) {
      navigate(ROUTES.blog);
      return;
    }
    flow.back();
  };

  const handleSave = () => {
    if (!flow.draft) return;
    addBlog({
      id: crypto.randomUUID(),
      title: flow.draft.title,
      startDate: flow.startDate,
      endDate: flow.endDate,
      toneId: flow.toneId,
      sections: flow.draft.sections,
      savedAt: getLocalDateString(),
    });
    showToast('블로그를 저장했어요', 'success');
    navigate(ROUTES.blog);
  };

  return (
    <main className="flex min-h-dvh flex-col bg-[#fffdf4] text-[#20251f]">
      <CreateStepHeader step={flow.step} onBack={handleBack} />
      <div className="flex flex-1 flex-col">
        {flow.step === 1 && (
          <DateStep
            startDate={flow.startDate}
            endDate={flow.endDate}
            trees={flow.trees}
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
