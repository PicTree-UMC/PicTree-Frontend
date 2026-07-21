import type { BlogStatus } from '../types/blog';
import { DateRangeCard } from './DateRangeCard';
import { DraftCard } from './DraftCard';
import { GeneratingCard } from './GeneratingCard';
import { CrownIcon, SparkleIcon } from './icons';

type BlogComposerProps = {
  status: BlogStatus;
  isPremium: boolean;
  onCreate: () => void;
};

export function BlogComposer({ status, isPremium, onCreate }: BlogComposerProps) {
  return (
    <section className="px-5 pt-5">
      <DateRangeCard />
      <button className={`mt-[18px] flex h-[61px] w-full items-center justify-center gap-3 rounded-xl text-[16px] font-bold shadow-[0_7px_14px_rgba(45,51,34,0.13)] ${isPremium ? 'bg-[#d0e2a9] text-[#4b4b4b]' : 'bg-[#efeded] text-[#494949]'}`} onClick={onCreate}>
        {isPremium ? <SparkleIcon /> : <CrownIcon />}
        {isPremium ? 'AI로 글 작성하기' : '프리미엄으로 글 작성하기'}
      </button>
      {status === 'generating' && <GeneratingCard />}
      {status === 'draft' && <DraftCard />}
    </section>
  );
}
