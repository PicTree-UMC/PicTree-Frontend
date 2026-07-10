import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { MOOD_EMOJIS } from '@/shared/constants/moodEmojis';
import { getLocalDateString } from '@/shared/lib/date';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { useBodyBackground } from '@/shared/hooks/useBodyBackground';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';

/** 사진 없이 기록하기(스킵) 흐름 전용. 사진이 있는 흐름은 CameraPage 검토 화면에서 바로 저장한다. */
export function RecordPage() {
  useLockBodyScroll();
  useBodyBackground('#171717');
  const navigate = useNavigate();
  const footerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [comment, setComment] = useState('');
  const [footerHeight, setFooterHeight] = useState(0);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const today = getLocalDateString();

  useEffect(() => {
    if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
  }, []);

  // 탭 대상(버튼)과 포커스 대상(입력창)을 분리하고 preventScroll 로 iOS 자동 스크롤을 막는다.
  const startEditingCaption = () => {
    flushSync(() => setIsEditingCaption(true));
    commentInputRef.current?.focus({ preventScroll: true });
  };

  const handleUpload = () => {
    // TODO: API 연동 시 useMutation으로 { selectedEmoji, placeName, date: today, comment } 업로드
    navigate(ROUTES.home);
  };

  return (
    <div className="relative flex h-dvh w-full flex-col bg-neutral-900">
      <div className="absolute inset-0 bg-neutral-800" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      <div
        className="relative z-10 flex items-start justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="취소"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <XIcon />
        </button>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-white">
            <PinIcon />
            <input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="상호명 입력"
              className="w-28 bg-transparent text-base outline-none placeholder:text-white/60"
            />
          </div>
          <span className="pr-1 text-xs text-white/70">{today}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* 캡션(이모지+한줄평): 포커스 시 키보드 높이만큼 부드럽게 올라간다 */}
      <div
        className="fixed inset-x-4 z-20 flex flex-col gap-2 transition-[bottom] duration-300 ease-out"
        style={{
          bottom:
            isEditingCaption && keyboardOffset > 0 ? keyboardOffset + 8 : footerHeight + 16,
        }}
      >
        {showEmojiPicker && (
          <div className="flex gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2">
            {MOOD_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setSelectedEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition ${
                  selectedEmoji === emoji ? 'bg-white/90' : 'bg-black/40'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
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
          {isEditingCaption ? (
            <input
              ref={commentInputRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => setIsEditingCaption(false)}
              placeholder="한줄평을 남겨주세요"
              className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-base text-white outline-none placeholder:text-white/60"
            />
          ) : (
            <button
              type="button"
              onClick={startEditingCaption}
              className="flex-1 truncate rounded-full bg-black/40 px-4 py-2.5 text-left text-base text-white"
            >
              {comment || <span className="text-white/60">한줄평을 남겨주세요</span>}
            </button>
          )}
        </div>
      </div>

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between bg-black/60 px-6 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <button
          onClick={() => navigate(ROUTES.camera)}
          className="text-sm font-medium text-white"
        >
          사진 촬영하기
        </button>
        <button
          onClick={handleUpload}
          className="rounded-full bg-pictree-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-pictree-700"
        >
          저장
        </button>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
