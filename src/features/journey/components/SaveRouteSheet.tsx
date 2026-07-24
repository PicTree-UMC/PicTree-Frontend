import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';

interface SaveRouteSheetProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function SaveRouteSheet({ onClose, onConfirm }: SaveRouteSheetProps) {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  // 표시용 버튼을 탭하면 실제 입력창을 동기 렌더한 직후 포커스한다.
  // preventScroll 로 iOS 가 배경을 밀어올리는 자동 스크롤을 막고,
  // 시트는 bottom transition 으로 키보드 위까지 부드럽게 올라간다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleConfirm = () => onConfirm(name);

  return (
    <>
      {/* 시안상 뒤 지도를 어둡게 깔지 않는다. 딤 없이 바깥 탭으로 닫는 영역만 유지. */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* 세이지(#c5d89d) 바텀시트. 데스크톱에선 max-w-[390px] 가운데 정렬.
          키보드가 열리면 bottom 을 키보드 높이만큼 올려 시트만 위로 이동(배경은 고정). */}
      <div
        style={{ bottom: keyboardOffset }}
        className="fixed inset-x-0 z-50 mx-auto w-full max-w-[390px] rounded-t-[24px] bg-[#c5d89d] px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-[bottom] duration-300 ease-out"
      >
        <h2 className="mb-4 px-3 text-base font-semibold tracking-wide text-[#2c3930]">
          동선 이름 설정
        </h2>

        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            onBlur={() => setIsEditing(false)}
            placeholder="- - - - - - -"
            className="h-11 w-full rounded-full bg-[#fffdf7] px-6 text-base text-[#2c3930] outline-none placeholder:text-[#999]"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="h-11 w-full truncate rounded-full bg-[#fffdf7] px-6 text-left text-base text-[#2c3930]"
          >
            {name || <span className="text-[#999]">- - - - - - -</span>}
          </button>
        )}

        <div className="mt-4 flex justify-center gap-6">
          <button
            onClick={onClose}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#d9d9d9] text-base font-semibold tracking-wide text-[#2c3930]"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="h-[38px] w-[92px] rounded-[12px] bg-[#fffcef] text-base font-semibold tracking-wide text-[#2c3930]"
          >
            저장하기
          </button>
        </div>
      </div>
    </>
  );
}
