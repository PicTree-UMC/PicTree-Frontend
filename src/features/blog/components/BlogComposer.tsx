import type { BlogStatus } from '../types/blog';
import { DateRangeCard } from './DateRangeCard';
import { DraftCard } from './DraftCard';
import { GeneratingCard } from './GeneratingCard';
import { SavedDraftCard } from './SavedDraftCard';
import { CrownIcon, SparkleIcon } from './icons';
import type { BlogTreeRecord } from '../types/blog';

type BlogComposerProps = {
  status: BlogStatus;
  isPremium: boolean;
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  activityByDate: Record<string, number>;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onCreate: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function BlogComposer({
  status,
  isPremium,
  startDate,
  endDate,
  trees,
  activityByDate,
  onDateRangeChange,
  onCreate,
  onSave,
  onDelete,
}: BlogComposerProps) {
  return (
    <section className="px-5 pt-5">
      <DateRangeCard startDate={startDate} endDate={endDate} trees={trees} activityByDate={activityByDate} onDateRangeChange={onDateRangeChange} />
      <button className="mt-[18px] flex h-[61px] w-full items-center justify-center gap-3 rounded-xl bg-[#d0e2a9] text-[16px] font-bold text-[#4b4b4b] shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-50" onClick={onCreate} disabled={trees.length === 0}>
        {isPremium ? <SparkleIcon /> : <CrownIcon />}
        {isPremium ? 'AI로 글 작성하기' : '프리미엄으로 글 작성하기'}
      </button>
      {status === 'generating' && <GeneratingCard />}
      {status === 'draft' && <DraftCard startDate={startDate} endDate={endDate} trees={trees} onSave={onSave} />}
      {status === 'saved' && <SavedDraftCard startDate={startDate} endDate={endDate} onDelete={onDelete} />}
    </section>
  );
}
