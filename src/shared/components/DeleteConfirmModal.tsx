import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { TrashIcon } from './TrashIcon';

type DeleteIconButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function DeleteIconButton({ label, onClick, className = '' }: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid size-10 shrink-0 place-items-center rounded-full text-error active:bg-red-50 ${className}`}
    >
      <TrashIcon className="h-[21px] w-[21px]" />
    </button>
  );
}

type DeleteConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-5"
      role="presentation"
      onClick={isDeleting ? undefined : onClose}
    >
      <section
        className="w-full max-w-[350px] rounded-[20px] bg-cream px-6 pb-5 pt-7 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex w-fit text-error" aria-hidden>
          <TrashIcon className="h-[38px] w-[38px]" />
        </div>
        <h2 id="delete-confirm-title" className="mt-2 text-xl font-semibold text-black">
          {title}
        </h2>
        <p id="delete-confirm-description" className="mt-2 text-[12px] text-ink-muted">
          {description}
        </p>
        <div className="mt-5 flex justify-center gap-[18px]">
          <button
            type="button"
            className="h-[39px] w-[92px] rounded-xl bg-line-soft text-base font-medium text-ink-muted disabled:opacity-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            type="button"
            className="h-[39px] w-[92px] rounded-xl bg-error text-base font-medium text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중' : '삭제'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
