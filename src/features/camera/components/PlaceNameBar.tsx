import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { EmojiPicker } from '@/shared/components/EmojiPicker';
import { PinIcon, XIcon } from './icons';

interface PlaceNameBarProps {
  selectedEmoji: string | null;
  onSelectEmoji: (emoji: string) => void;
  placeName: string;
  onPlaceNameChange: (value: string) => void;
}

/**
 * 촬영 검토 화면 하단 바. 좌측 이모지 버튼 + 장소명 입력으로 구성된다.
 * 인스타 스토리의 캡션 자리를 장소명 입력으로 대체했다.
 * 탭하면 키보드가 올라오고(useKeyboardOffset), 입력창이 키보드 위로 붙는다.
 */
export function PlaceNameBar({
  selectedEmoji,
  onSelectEmoji,
  placeName,
  onPlaceNameChange,
}: PlaceNameBarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  // 탭 직후 동기 렌더된 입력창을 포커스. preventScroll로 iOS 자동 스크롤을 막는다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const clearField = () => {
    onPlaceNameChange('');
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      className={
        isEditing
          ? 'fixed inset-x-4 z-20 flex flex-col gap-2 transition-[bottom] duration-300 ease-out'
          : 'flex flex-col gap-2 px-3 pb-1'
      }
      style={isEditing ? { bottom: keyboardOffset > 0 ? keyboardOffset + 8 : 8 } : undefined}
    >
      {showEmojiPicker && (
        <EmojiPicker
          variant="row"
          selected={selectedEmoji}
          onSelect={(emoji) => {
            onSelectEmoji(emoji);
            setShowEmojiPicker(false);
          }}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          aria-label="기분 이모지 선택"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-xl"
        >
          {selectedEmoji ?? '🙂'}
        </button>

        {isEditing ? (
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={placeName}
              onChange={(e) => onPlaceNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              placeholder="장소명을 입력하세요"
              className="w-full rounded-full bg-black/45 py-2.5 pl-4 pr-11 text-base text-white outline-none placeholder:text-white/60"
            />
            {placeName && (
              <button
                type="button"
                aria-label="입력 지우기"
                // mousedown 기본동작(포커스 이동)을 막아 blur로 입력창이 사라지기 전에 onClick이 실행되게 한다.
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearField}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white/80"
              >
                <XIcon />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="flex flex-1 items-center gap-1.5 rounded-full bg-black/45 px-4 py-2.5 text-left text-base"
          >
            <PinIcon />
            <span className={`truncate ${placeName ? 'text-white' : 'text-white/60'}`}>
              {placeName || '장소명을 입력하세요'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
