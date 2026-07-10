import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { EmojiPicker } from './EmojiPicker';

interface CaptionEditorProps {
  selectedEmoji: string | null;
  onSelectEmoji: (emoji: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

/**
 * 촬영 검토 화면에서 사진 위에 겹치는 캡션(이모지 + 한줄평).
 * 편집·이모지 피커·키보드 대응은 이 컴포넌트 내부에서 관리한다.
 */
export function CaptionEditor({
  selectedEmoji,
  onSelectEmoji,
  comment,
  onCommentChange,
}: CaptionEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  // 하단 표시용 버튼을 탭하면, 렌더된 실제 입력창을 동기 렌더 직후 포커스한다.
  // preventScroll 로 iOS 자동 스크롤을 막고, 위치는 CSS transition 으로 키보드 위까지 부드럽게 올라간다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    commentInputRef.current?.focus({ preventScroll: true });
  };

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
            ref={commentInputRef}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            placeholder="한줄평을 남겨주세요"
            className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-base text-white outline-none placeholder:text-white/60"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="flex-1 truncate rounded-full bg-black/40 px-4 py-2.5 text-left text-base text-white"
          >
            {comment || <span className="text-white/60">한줄평을 남겨주세요</span>}
          </button>
        )}
      </div>
    </div>
  );
}
