import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { MOOD_EMOJIS } from '@/shared/constants/moodEmojis';
import { getLocalDateString } from '@/shared/lib/date';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { useBodyBackground } from '@/shared/hooks/useBodyBackground';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { useCameraStream, type FacingMode } from './hooks/useCameraStream';
import { captureFrame } from './lib/captureFrame';

// 배율 조정 옵션
const ZOOM_STEPS = [1, 1.5, 2] as const;

export function CameraPage() {
  useLockBodyScroll();
  useBodyBackground('#000000');
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [zoom, setZoom] = useState<number>(ZOOM_STEPS[0]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const { videoRef, error } = useCameraStream(facingMode);
  const viewportRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const isMirrored = facingMode === 'user';
  const keyboardOffset = useKeyboardOffset();

  // 하단 표시용 버튼을 탭하면, 렌더된 실제 입력창을 동기 렌더 직후 포커스한다.
  // preventScroll 로 iOS 자동 스크롤을 막고, 위치는 CSS transition 으로 키보드 위까지 부드럽게 올라간다.
  const startEditingCaption = () => {
    flushSync(() => setIsEditingCaption(true));
    commentInputRef.current?.focus({ preventScroll: true });
  };

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [comment, setComment] = useState('');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const today = getLocalDateString();

  const handleCapture = () => {
    if (!videoRef.current || !viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    setCapturedPhoto(
      captureFrame(videoRef.current, zoom, clientWidth / clientHeight, isMirrored),
    );
  };

  const handleRetake = () => setCapturedPhoto(null);
  const handleCancel = () => {
    setCapturedPhoto(null);
    navigate(ROUTES.home);
  };
  const handleSave = () => {
    // TODO: API 연동 시 useMutation으로 { photo: capturedPhoto, selectedEmoji, placeName, date: today, comment } 업로드
    navigate(ROUTES.home);
  };
  const handleSkip = () => navigate(ROUTES.record);
  const toggleFacing = () =>
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  const cycleZoom = () =>
    setZoom((prev) => ZOOM_STEPS[(ZOOM_STEPS.indexOf(prev as (typeof ZOOM_STEPS)[number]) + 1) % ZOOM_STEPS.length]);

  return (
    <div className="flex h-dvh w-full flex-col bg-black">
      <header className={`pt-safe flex min-h-11 items-center gap-2 px-4 pb-2 text-white ${capturedPhoto ? '' : 'justify-center'}`}>
        {capturedPhoto ? (
          <>
            <button
              onClick={handleCancel}
              aria-label="취소"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40"
            >
              <XIcon />
            </button>
            <div className="flex flex-1 justify-center">
              <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5">
                <PinIcon />
                <input
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="상호명 입력"
                  className="w-28 bg-transparent text-base outline-none placeholder:text-white/60"
                />
              </div>
            </div>
            <span className="shrink-0 text-xs text-white/70">{today}</span>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <img src="/apple-touch-icon.jpg" alt="" className="h-6 w-6 rounded-md" />
            <span className="text-lg font-bold">PicTree</span>
          </div>
        )}
      </header>

      <div ref={viewportRef} className="relative mx-3 my-2 min-h-0 flex-1 overflow-hidden rounded-3xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: `scale(${zoom})${isMirrored ? ' scaleX(-1)' : ''}` }}
          className="h-full w-full origin-center object-cover"
        />
        {error && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white">
            {error}
          </p>
        )}

        {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="촬영된 사진"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <button
            onClick={cycleZoom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
          >
            {zoom.toFixed(1)}x
          </button>
        )}
      </div>

      {capturedPhoto && (
        <div
          className={
            isEditingCaption
              ? 'fixed inset-x-4 z-20 flex flex-col gap-2 transition-[bottom] duration-300 ease-out'
              : 'mx-3 mb-2 flex flex-col gap-2'
          }
          style={
            isEditingCaption ? { bottom: keyboardOffset > 0 ? keyboardOffset + 8 : 8 } : undefined
          }
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
      )}

      <div
        className="flex flex-col gap-3 bg-black pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        {capturedPhoto ? (
          <div className="flex items-center gap-3 px-4">
            <button
              onClick={handleRetake}
              className="flex-1 rounded-xl bg-neutral-700 py-3 text-sm font-medium text-white"
            >
              다시찍기
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-pictree-500 py-3 text-sm font-semibold text-white"
            >
              업로드
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-around px-6">
            <button
              onClick={handleSkip}
              aria-label="사진 없이 기록하기"
              className="flex h-11 w-11 items-center justify-center text-white"
            >
              <PencilIcon />
            </button>
            <button
              onClick={handleCapture}
              aria-label="촬영"
              className="h-16 w-16 rounded-full border-4 border-white bg-white"
            />
            <button onClick={toggleFacing} aria-label="전/후면 전환" className="flex h-11 w-11 items-center justify-center text-white">
              <SwitchCameraIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SwitchCameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h5M20 20v-5h-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 15a8 8 0 0014.9 2.5M19.5 9a8 8 0 00-14.9-2.5" />
    </svg>
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
