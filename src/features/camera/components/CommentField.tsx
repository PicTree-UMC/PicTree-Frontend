import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { TapIcon } from './icons';

interface CommentFieldProps {
  comment: string;
  onCommentChange: (value: string) => void;
}

/**
 * 촬영 검토 화면 중앙의 한줄평 입력.
 * 인스타 스토리처럼 사진 중앙을 탭하면 입력창이 열리고, 입력한 한줄평은 중앙에 고정 텍스트로 표시된다.
 * 편집 중에는 키보드 위로 올라오도록 fixed 위치를 잡고(useKeyboardOffset), 레이아웃을 유지하려고
 * 표시/탭 영역(flex-1)은 항상 자리를 지킨다.
 */
export function CommentField({ comment, onCommentChange }: CommentFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keyboardOffset = useKeyboardOffset();

  // 탭한 뒤 동기 렌더 직후 포커스한다. preventScroll로 iOS 자동 스크롤을 막고,
  // 위치는 CSS transition으로 키보드 위까지 부드럽게 올라간다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    inputRef.current?.focus({ preventScroll: true });
  };

  // Enter로 입력 완료(줄바꿈은 Shift+Enter). blur가 편집 종료 트리거.
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center px-8">
      {!isEditing && (
        <button
          type="button"
          onClick={startEditing}
          className="absolute inset-0 flex items-center justify-center px-8"
        >
          {comment ? (
            <span className="whitespace-pre-wrap break-words text-center text-xl font-semibold leading-snug text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              {comment}
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1.5 text-white/55">
              <TapIcon />
              <span className="text-sm">화면을 탭해 한줄평을 남겨보세요</span>
            </span>
          )}
        </button>
      )}

      {isEditing && (
        // 밝은 사진에서 흰 한줄평이 묻히지 않도록 포커싱 중엔 배경을 어둡게. 탭하면 입력을 닫는다.
        <button
          type="button"
          aria-label="입력 닫기"
          onClick={() => inputRef.current?.blur()}
          className="animate-fade-in fixed inset-0 z-10 bg-black/40"
        />
      )}

      {isEditing && (
        <div
          className="fixed inset-x-6 z-20 transition-[bottom] duration-300 ease-out"
          style={{
            bottom: keyboardOffset > 0 ? keyboardOffset + 16 : undefined,
            top: keyboardOffset > 0 ? undefined : '42%',
          }}
        >
          <textarea
            ref={inputRef}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            rows={2}
            placeholder="한줄평을 남겨주세요"
            className="w-full resize-none bg-transparent text-center text-xl font-semibold leading-snug text-white outline-none placeholder:text-white/50 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}
    </div>
  );
}
