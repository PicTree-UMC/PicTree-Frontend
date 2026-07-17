import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';

interface RenameModalProps {
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
}

/** 입력 필드 안 펜 아이콘(디자인 lucide:pen-line). 인라인 SVG. */
function PenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

/**
 * 동선 이름 변경 모달. 공용 Modal 대신 시안 전용 마크업으로 구성한다.
 * 열림/닫힘은 부모의 조건부 렌더로 제어(마운트 = 열림).
 */
export function RenameModal({ currentTitle, onClose, onConfirm }: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  useLockBodyScroll();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConfirm = () => onConfirm(newTitle);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 px-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[350px] rounded-[20px] bg-[#fffcef] px-6 py-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-[0.2px] text-[#111]">이름 변경</h2>

        <div className="mt-4 flex items-center gap-2 rounded-[20px] border-2 border-[#89986d] bg-[#fffdfd] px-2.5 py-1.5">
          <PenIcon className="size-[26px] shrink-0 text-[#2c3930]" />
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#2c3930] outline-none"
          />
        </div>

        <div className="mt-5 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#e6e6e6] text-base font-semibold tracking-wide text-[#2c3930]"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#f6f0d7] text-base font-semibold tracking-wide text-[#2c3930]"
          >
            변경
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
