import type { BlogStatus } from '../types/blog';
import { DateRangeCard } from './DateRangeCard';
import { DraftCard } from './DraftCard';
import { GeneratingCard } from './GeneratingCard';
import { CrownIcon, SparkleIcon } from './icons';

type BlogComposerProps = { status: BlogStatus; onCreate: () => void };

export function BlogComposer({ status, onCreate }: BlogComposerProps) {
  const isFree = status === 'free';
  return (
    <section className="px-5 pt-5">
      <DateRangeCard />
      <button className={`mt-[18px] flex h-[61px] w-full items-center justify-center gap-3 rounded-xl text-[16px] font-bold shadow-[0_7px_14px_rgba(45,51,34,0.13)] ${isFree ? 'bg-[#efeded] text-[#494949]' : 'bg-[#d0e2a9] text-[#4b4b4b]'}`} onClick={onCreate}>
        {isFree ? <CrownIcon /> : <SparkleIcon />}
        {isFree ? '프리미엄으로 글 작성하기' : 'AI로 글 작성하기'}
      </button>
      {status === 'generating' && <GeneratingCard />}
      {status === 'draft' && <DraftCard />}
    </section>
  );
}
