import { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';

interface RenameModalProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
}

export function RenameModal({ isOpen, currentTitle, onClose, onConfirm }: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);

  const handleConfirm = () => onConfirm(newTitle);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="이름 변경"
      footer={
        <>
          <Button onClick={onClose} className="bg-gray-100 text-gray-500 hover:bg-gray-200">
            취소
          </Button>
          <Button onClick={handleConfirm}>
            변경
          </Button>
        </>
      }
    >
      <Input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        autoFocus
        className="w-full mt-2"
      />
    </Modal>
  );
}