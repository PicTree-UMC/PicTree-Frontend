import { ConfirmModal } from '../../../shared/components/Modal';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="동선 삭제"
      message="동선을 삭제할까요?"
      confirmText="삭제"
      cancelText="취소"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}