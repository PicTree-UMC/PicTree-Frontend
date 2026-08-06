import { createPortal } from 'react-dom';
import { DeleteIcon } from './icons';

type DeleteDraftModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export function DeleteDraftModal({ isOpen, onClose, onConfirm, isDeleting = false }: DeleteDraftModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-y-0 left-1/2 z-[60] flex w-full -translate-x-1/2 items-center justify-center bg-black/55 px-5 sm:max-w-[390px]"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="w-full rounded-[20px] bg-[#fffcef] px-6 pb-[15px] pt-[30px] text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-draft-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex w-fit text-[#dc2626]" aria-hidden><DeleteIcon size={38} /></div>
        <h2 id="delete-draft-title" className="mt-2 text-xl font-medium">이 초안을 삭제할까요?</h2>
        <p className="mt-1 text-[12px] text-[#60655c]">삭제한 초안은 다시 되돌릴 수 없어요</p>
        <div className="mt-2 flex justify-center gap-[18px]">
          <button type="button" className="h-[39px] w-[92px] rounded-xl bg-[#e4e5e6] text-base font-medium text-[#60655c] disabled:opacity-50" onClick={onClose} disabled={isDeleting}>취소</button>
          <button type="button" className="h-[39px] w-[92px] rounded-xl bg-[#dc2626] text-base font-medium text-white disabled:opacity-50" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? '삭제 중' : '제거'}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
