import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { TrashIcon } from '@/shared/components';

interface DeleteMarkerModalProps {
  placeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 마커(장소) 삭제 확인 모달. 스토리 뷰어(z-50) 위에 뜨도록 z-[60] 으로 올린다.
 * 마운트 = 열림. Esc·배경 탭·취소로 닫히고, 삭제 버튼에서만 onConfirm.
 */
export function DeleteMarkerModal({ placeName, onClose, onConfirm }: DeleteMarkerModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[60] mx-auto flex items-center justify-center bg-black/60 px-6 sm:max-w-[390px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[320px] rounded-2xl bg-cream px-6 py-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <TrashIcon className="mx-auto h-8 w-8 text-error" />
        <h2 className="mt-3 text-lg font-medium text-neutral-900">이 장소를 삭제할까요?</h2>
        <p className="mt-2 text-[13px] text-neutral-500">
          “{placeName}”의 기록이 영구 삭제됩니다.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-neutral-200 text-[15px] font-medium text-neutral-700"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="h-11 flex-1 rounded-xl bg-error text-[15px] font-medium text-white"
          >
            삭제
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
