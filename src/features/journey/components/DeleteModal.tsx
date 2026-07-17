import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';

interface DeleteModalProps {
  journeyTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** 삭제 강조 휴지통 아이콘(디자인 상단 Vector). 인라인 SVG. */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  );
}

/**
 * 동선 삭제 확인 모달. 공용 ConfirmModal 대신 시안 전용 마크업으로 구성한다.
 * 열림/닫힘은 부모의 조건부 렌더로 제어(마운트 = 열림).
 */
export function DeleteModal({ journeyTitle, onClose, onConfirm }: DeleteModalProps) {
  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 px-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[350px] rounded-[20px] bg-[#fffcef] px-6 py-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <TrashIcon className="mx-auto h-8 w-8 text-[#ff5858]" />
        <h2 className="mt-3 text-xl font-bold tracking-[2px] text-black">동선을 삭제할까요?</h2>
        <p className="mt-2 text-[11px] text-[#2c3930]">
          “{journeyTitle}”이(가) 영구 삭제됩니다.
        </p>
        <div className="mt-5 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#e6e6e6] text-base font-semibold tracking-wide text-[#2c3930]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#ff5858] text-base font-semibold tracking-wide text-white"
          >
            삭제
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
