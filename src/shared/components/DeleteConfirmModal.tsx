import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type TrashIconProps = {
  className?: string;
  size?: number;
};

export function TrashIcon({ className, size = 20 }: TrashIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 10v7m4-7v7" />
    </svg>
  );
}

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
      className={`grid size-10 shrink-0 place-items-center rounded-full text-[#dc2626] active:bg-red-50 ${className}`}
    >
      <TrashIcon size={21} />
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
        className="w-full max-w-[350px] rounded-[20px] bg-[#fffcef] px-6 pb-5 pt-7 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex w-fit text-[#dc2626]" aria-hidden>
          <TrashIcon size={38} />
        </div>
        <h2 id="delete-confirm-title" className="mt-2 text-xl font-semibold text-black">
          {title}
        </h2>
        <p id="delete-confirm-description" className="mt-2 text-[12px] text-[#60655c]">
          {description}
        </p>
        <div className="mt-5 flex justify-center gap-[18px]">
          <button
            type="button"
            className="h-[39px] w-[92px] rounded-xl bg-[#e4e5e6] text-base font-medium text-[#60655c] disabled:opacity-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            type="button"
            className="h-[39px] w-[92px] rounded-xl bg-[#dc2626] text-base font-medium text-white disabled:opacity-50"
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
