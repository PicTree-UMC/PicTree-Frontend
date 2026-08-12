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
 * 동선 이름 변경 모달. 시안 전용 마크업이다 — 공용 `DeleteConfirmModal` 은 파괴적 확인
 * 전용이라 입력을 받지 않는다(종전엔 여기서 안 쓴다고 적어 둔 상대가 공용 `Modal` 이었는데,
 * 그건 마지막 사용처가 없어져 지웠다).
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

  /*
    ⚠️ **다듬은 값으로 판단하고, 다듬은 값을 보낸다.** 공백만 남긴 채 '변경' 을 누르면
    그대로 요청이 나가서 이름이 빈 카드가 목록에 남았다(이슈 #293). 닉네임 시트
    (`NicknameEditSheet`)·동선 저장(`RouteSavePage`)이 이미 같은 규칙이다.

    길이 상한은 두지 않는다 — 서버 제약이 확인된 바 없고, 목록 카드가 긴 이름을 두 줄로
    흘리도록 짜여 있다(`RouteListPage` 의 카드 주석이 '이름 변경에 maxLength 가 없다' 는
    사실에 기대고 있다).
  */
  const trimmed = newTitle.trim();
  const isEmpty = trimmed.length === 0;

  const handleConfirm = () => {
    if (isEmpty) return;
    onConfirm(trimmed);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 px-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[350px] rounded-[20px] bg-cream px-6 py-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-[0.2px] text-ink">이름 변경</h2>

        <div
          className={`mt-4 flex items-center gap-2 rounded-[20px] border-2 bg-white px-2.5 py-1.5 ${
            isEmpty ? 'border-error' : 'border-pictree-500'
          }`}
        >
          <PenIcon className="size-[26px] shrink-0 text-ink" />
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            aria-invalid={isEmpty}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none"
          />
        </div>

        {/*
          안내 자리를 늘 잡아 둔다. 글자를 지우다 안내가 나타나면서 버튼이 아래로 밀리면,
          마침 그 자리를 누르던 손가락이 '변경' 대신 방금 생긴 여백을 누른다
          (`NicknameEditSheet` 와 같은 이유).
        */}
        <p className="mt-1.5 min-h-[18px] pl-1 text-[13px] leading-[18px] text-error">
          {isEmpty ? '이름을 입력해주세요.' : ''}
        </p>

        <div className="mt-3 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="h-[38px] w-[92px] rounded-[12px] bg-line-soft text-base font-semibold tracking-wide text-ink"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isEmpty}
            className="h-[38px] w-[92px] rounded-[12px] bg-cream-sub text-base font-semibold tracking-wide text-ink disabled:bg-line disabled:text-ink-disabled"
          >
            변경
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
