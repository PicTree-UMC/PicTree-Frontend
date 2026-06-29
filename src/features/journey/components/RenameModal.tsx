import { useState } from "react";

interface RenameModalProps {
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
}

export function RenameModal({ currentTitle, onClose, onConfirm }: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);

  return (
    <>
      {/* 배경 딤드 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">이름 변경</h2>
        
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-500"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(newTitle)}
            className="flex-1 rounded-lg bg-green-500 py-2 text-sm text-white"
          >
            변경
          </button>
        </div>
      </div>
    </>
  );
}