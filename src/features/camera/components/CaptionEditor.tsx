import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { EmojiPicker } from './EmojiPicker';

interface CaptionEditorProps {
  selectedEmoji: string | null;
  onSelectEmoji: (emoji: string) => void;
  placeName: string;
  onPlaceNameChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

type Stage = 'placeName' | 'comment';

/**
 * 촬영 검토 화면에서 사진 위에 겹치는 캡션 입력.
 * 하나의 입력창이 "상호명 → (엔터) → 한줄평" 순서로 단계 전환된다.
 * placeName이 이미 채워져 있으면(재촬영 등) comment 단계부터 시작한다.
 */
export function CaptionEditor({
  selectedEmoji,
  onSelectEmoji,
  placeName,
  onPlaceNameChange,
  comment,
  onCommentChange,
}: CaptionEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stage, setStage] = useState<Stage>(placeName ? 'comment' : 'placeName');
  // 상호명은 타이핑 중엔 로컬 draft로만 갖고 있다가, 엔터를 눌러야 부모(헤더)로 커밋된다.
  const [draftPlaceName, setDraftPlaceName] = useState(placeName);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  // 하단 표시용 버튼을 탭하면, 렌더된 실제 입력창을 동기 렌더 직후 포커스한다.
  // preventScroll 로 iOS 자동 스크롤을 막고, 위치는 CSS transition 으로 키보드 위까지 부드럽게 올라간다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // 상호명 단계에서 엔터: 그제서야 부모로 커밋해 헤더에 등장시키고, 같은 입력창을 한줄평 단계로 전환 (포커스 유지)
    if (stage === 'placeName') {
      onPlaceNameChange(draftPlaceName);
      setStage('comment');
    }
  };

  const value = stage === 'placeName' ? draftPlaceName : comment;
  const onChange = stage === 'placeName' ? setDraftPlaceName : onCommentChange;
  const placeholder = stage === 'placeName' ? '어떤 장소인가요?' : '한줄평을 남겨주세요';

  return (
    <div
      className={
        isEditing
          ? 'fixed inset-x-4 z-20 flex flex-col gap-2 transition-[bottom] duration-300 ease-out'
          : 'animate-fade-in-up mx-3 mb-2 flex flex-col gap-2'
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-xl"
        >
          {selectedEmoji ?? '🙂'}
        </button>
        {isEditing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            placeholder={placeholder}
            className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-base text-white outline-none placeholder:text-white/60"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="flex-1 truncate rounded-full bg-black/40 px-4 py-2.5 text-left text-base text-white"
          >
            {value || <span className="text-white/60">{placeholder}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
