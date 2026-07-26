import type { BlogTreeRecord } from '../types/blog';
import { formatDateRange } from '../lib/formatBlogDate';

type DraftCardProps = {
  startDate: string;
  endDate: string;
  trees: BlogTreeRecord[];
  onSave: () => void;
};

export function DraftCard({ startDate, endDate, trees, onSave }: DraftCardProps) {
  return (
    <div className="mt-5">
      <div className="flex h-[43px] items-center justify-between rounded-xl bg-[#edf5d9] px-4 text-[12px]">
        <span className="flex items-center gap-2"><span className="text-lg">✨</span> AI 작성 초안</span>
        <span className="flex gap-3"><button type="button" className="rounded-full bg-[#819650] px-3 py-1 text-white" onClick={onSave}>저장하기</button><button type="button" className="rounded-full bg-[#a5b68a] px-3 py-1 text-white">복사하기</button></span>
      </div>
      <article className="mt-3 rounded-xl border-2 border-[#bed793] bg-white px-[22px] py-5 text-[13px]">
        <h2 className="text-[15px] font-bold">[여행기록] {formatDateRange(startDate, endDate)}</h2><p className="mt-4">여행 후기</p>
        {trees.map((tree, index) => (
          <div key={tree.treeId}>
            <hr className="my-4 border-black" />
            <DraftSection index={index + 1} tree={tree} />
          </div>
        ))}
      </article>
    </div>
  );
}

function DraftSection({ index, tree }: { index: number; tree: BlogTreeRecord }) {
  return <><h3 className="font-bold">{index}. {tree.name}</h3><div className="mt-2 flex items-start gap-3 leading-6 text-[#555]"><p className="min-w-0 flex-1">{tree.description}</p><img src={tree.defaultImage} alt={`${tree.name}에서 촬영한 사진`} className="h-[78px] w-[78px] shrink-0 rounded-[22px] object-cover" /></div></>;
}
