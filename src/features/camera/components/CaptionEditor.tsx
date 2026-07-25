import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { EmojiPicker } from './EmojiPicker';
import { XIcon } from './icons';

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

  // 포커스 아웃 시에도 상호명 draft를 부모(헤더)로 커밋한다.
  // 엔터로만 저장되던 기존 동작은 "입력했는데 반영 안 됐다"는 혼란을 줘, blur도 저장 트리거로 삼는다.
  // (한줄평 단계의 comment는 이미 부모에 바로 바인딩돼 있어 별도 커밋이 필요 없다.)
  const handleBlur = () => {
    if (stage === 'placeName') onPlaceNameChange(draftPlaceName);
    setIsEditing(false);
  };

  // 현재 단계의 입력값을 지운다. draft(상호명)/comment(한줄평) 각각을 비우고,
  // 상호명이면 헤더에 이미 커밋된 값도 함께 비운 뒤 입력창에 포커스를 되돌린다.
  const clearField = () => {
    onChange('');
    if (stage === 'placeName') onPlaceNameChange('');
    inputRef.current?.focus({ preventScroll: true });
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
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="w-full rounded-full bg-black/40 py-2.5 pl-4 pr-11 text-base text-white outline-none placeholder:text-white/60"
            />
            {value && (
              <button
                type="button"
                aria-label="입력 지우기"
                // mousedown 기본동작(포커스 이동)을 막아 blur→커밋으로 입력창이 사라지기 전에 onClick이 실행되게 한다.
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
            className="flex-1 truncate rounded-full bg-black/40 px-4 py-2.5 text-left text-base text-white"
          >
            {value || <span className="text-white/60">{placeholder}</span>}
          </button>
        )}
      </div>
    </div>
  );
}
