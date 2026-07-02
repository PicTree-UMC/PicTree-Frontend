import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** 공용 모달. isOpen 으로 부모가 여닫는 controlled 방식. */
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode; // 하단 버튼 영역
  closeOnOverlay?: boolean; // 배경 클릭으로 닫기 (기본 true)
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnOverlay = true,
}: ModalProps) {
  // ESC 로 닫기 (열려 있을 때만 등록하고 정리)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // createPortal: body 에 그려 부모의 overflow/z-index 영향을 받지 않게 함
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* 카드 내부 클릭이 배경까지 전달돼 닫히지 않도록 stopPropagation */}
      <div
        className="w-full max-w-sm rounded-md bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-2 text-base font-semibold text-neutral-900">{title}</h2>}
        {children && <div className="text-sm text-neutral-600">{children}</div>}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** 확인/취소 프리셋 모달 (예: "이 기록을 삭제할까요?"). */
type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // 처리 중이면 확인 버튼 비활성화
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmText}
          </button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
