import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { getLocalDateString } from '@/shared/lib/date';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { useBodyBackground } from '@/shared/hooks/useBodyBackground';
import { useCameraStream, type FacingMode } from './hooks/useCameraStream';
import { useRecordForm } from './hooks/useRecordForm';
import { captureFrame } from './lib/captureFrame';
import { CameraControls } from './components/CameraControls';
import { CaptionEditor } from './components/CaptionEditor';
import { RecordForm } from './components/RecordForm';
import { PinIcon, XIcon } from './components/icons';

// 배율 조정 옵션
const ZOOM_STEPS = [1, 1.5, 2] as const;

export function CameraPage() {
  useLockBodyScroll();
  useBodyBackground('#000000');
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [zoom, setZoom] = useState<number>(ZOOM_STEPS[0]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const { videoRef, error } = useCameraStream(facingMode);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isMirrored = facingMode === 'user';

  const { selectedEmoji, setSelectedEmoji, placeName, setPlaceName, comment, setComment } =
    useRecordForm();
  const today = getLocalDateString();

  const handleCapture = () => {
    if (!videoRef.current || !viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    setCapturedPhoto(
      captureFrame(videoRef.current, zoom, clientWidth / clientHeight, isMirrored),
    );
  };

  const handleRetake = () => setCapturedPhoto(null);
  const handleClose = () => navigate(ROUTES.home);
  const handleSave = () => {
    // TODO: API 연동 시 useMutation으로 { photo: capturedPhoto, selectedEmoji, placeName, date: today, comment } 업로드
    navigate(ROUTES.home);
  };
  const toggleWriteMode = () => setIsWriteMode((prev) => !prev);
  const toggleFacing = () =>
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  const cycleZoom = () =>
    setZoom((prev) => ZOOM_STEPS[(ZOOM_STEPS.indexOf(prev as (typeof ZOOM_STEPS)[number]) + 1) % ZOOM_STEPS.length]);

  return (
    <div ref={viewportRef} className="relative h-full w-full overflow-hidden bg-black">
      {/* 카메라 프리뷰 (항상 마운트해 스트림 유지) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ transform: `scale(${zoom})${isMirrored ? ' scaleX(-1)' : ''}` }}
        className="absolute inset-0 h-full w-full origin-center object-cover"
      />
      {error && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white">
          {error}
        </p>
      )}

      {/* 촬영된 사진 */}
      {capturedPhoto && (
        <img src={capturedPhoto} alt="촬영된 사진" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* 작성 모드: 카메라를 가리는 불투명 배경 */}
      {isWriteMode && !capturedPhoto && <div className="absolute inset-0 bg-neutral-900" />}

      {/* 상/하단 컨트롤 가독성용 스크림 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

      {/* 컨트롤 레이어 */}
      <div className="relative z-10 flex h-full flex-col text-white">
        <header
          className="flex items-center gap-2 px-4 pb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <button
            onClick={handleClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40"
          >
            <XIcon />
          </button>

          {capturedPhoto ? (
            <>
              <div className="flex flex-1 justify-center">
                {placeName && (
                  <div className="animate-fade-in-down flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5">
                    <PinIcon />
                    <span className="max-w-[160px] truncate text-base text-white">{placeName}</span>
                  </div>
                )}
              </div>
              <span className="animate-fade-in-down shrink-0 text-sm text-white/70">{today}</span>
            </>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                <img src="/apple-touch-icon.jpg" alt="" className="h-6 w-6 rounded-md" />
                <span className="text-lg font-bold">PicTree</span>
              </div>
              <div className="w-9 shrink-0" />
            </>
          )}
        </header>

        {/* 작성 모드 폼 / 그 외에는 카메라가 비치는 투명 영역(+ 배율 배지) */}
        {isWriteMode && !capturedPhoto ? (
          <RecordForm
            selectedEmoji={selectedEmoji}
            onSelectEmoji={setSelectedEmoji}
            placeName={placeName}
            onPlaceNameChange={setPlaceName}
            comment={comment}
            onCommentChange={setComment}
          />
        ) : (
          <div className="relative flex-1">
            {!capturedPhoto && (
              <button
                onClick={cycleZoom}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
              >
                {zoom.toFixed(1)}x
              </button>
            )}
          </div>
        )}

        {/* 촬영 검토: 사진 위 캡션(이모지 + 한줄평) */}
        {capturedPhoto && (
          <CaptionEditor
            selectedEmoji={selectedEmoji}
            onSelectEmoji={setSelectedEmoji}
            placeName={placeName}
            onPlaceNameChange={setPlaceName}
            comment={comment}
            onCommentChange={setComment}
          />
        )}

        <CameraControls
          hasPhoto={!!capturedPhoto}
          isWriteMode={isWriteMode}
          onCapture={handleCapture}
          onToggleFacing={toggleFacing}
          onToggleWriteMode={toggleWriteMode}
          onRetake={handleRetake}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
