import { useState } from 'react';
import { DeleteDraftModal } from './DeleteDraftModal';
import { DeleteIcon } from './icons';
import { formatDateRange } from '../lib/formatBlogDate';

type SavedDraftCardProps = {
  startDate: string;
  endDate: string;
  onDelete: () => void;
};

export function SavedDraftCard({ startDate, endDate, onDelete }: SavedDraftCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    setDeleteOpen(false);
    onDelete();
  };

  return (
    <>
      <article className="relative mt-4 rounded-xl border-2 border-[#bed793] bg-white px-[23px] py-[20px]">
        <time className="absolute right-4 top-3 text-[10px] text-[#999]" dateTime="2026-04-02">2026년 4월 2일 저장 완료</time>
        <h2 className="mt-1 text-[15px] font-bold">[여행기록] {formatDateRange(startDate, endDate)}</h2>
        <p className="mt-1 text-[15px] text-[#999]">{formatDateRange(startDate, endDate, true)}</p>
        <button
          type="button"
          className="absolute bottom-[22px] right-[14px] grid h-[29px] w-[29px] place-items-center rounded-full bg-[#ffdfe0] text-[#ff575d]"
          aria-label="저장된 초안 삭제"
          onClick={() => setDeleteOpen(true)}
        >
          <DeleteIcon size={16} />
        </button>
      </article>
      <DeleteDraftModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />
    </>
  );
}
