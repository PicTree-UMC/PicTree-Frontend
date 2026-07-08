import { useState } from 'react';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';

interface SaveRouteSheetProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function SaveRouteSheet({ onClose, onConfirm }: SaveRouteSheetProps) {
  const [name, setName] = useState('');

  const handleConfirm = () => onConfirm(name);

  return (
    <>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">동선 이름 설정</h2>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
          className="w-full"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose} className="bg-gray-100 text-gray-500 hover:bg-gray-200">
            취소
          </Button>
          <Button onClick={handleConfirm}>저장하기</Button>
        </div>
      </div>
    </>
  );
}
