import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { getLocalDateString } from '@/shared/lib/date';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { useBodyBackground } from '@/shared/hooks/useBodyBackground';
import { useGeolocation, type GeoCoords } from '@/shared/hooks/useGeolocation';
import { useToast } from '@/shared/components/toast/toastStore';
import { useCameraStream, type FacingMode } from './hooks/useCameraStream';
import { useRecordForm } from './hooks/useRecordForm';
import { useCreateTreeRecord } from './hooks/useCreateTreeRecord';
import { captureFrame } from './lib/captureFrame';
import { CameraControls } from './components/CameraControls';
import { CommentField } from './components/CommentField';
import { LocationAccuracyBar } from './components/LocationAccuracyBar';
import { LocationPickerSheet } from './components/LocationPickerSheet';
import { PlaceNameBar } from './components/PlaceNameBar';
import { RecordForm } from './components/RecordForm';
import { XIcon } from './components/icons';

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

  const { selectedEmoji, setSelectedEmoji, placeName, setPlaceName, comment, setComment, isValid } =
    useRecordForm();
  const { coords: gpsCoords, request: requestLocation } = useGeolocation();
  const { showToast } = useToast();
  const { mutate: saveRecord, isPending: isSaving } = useCreateTreeRecord();
  const today = getLocalDateString();

  /*
   * 지도에서 직접 고른 좌표. 있으면 GPS 좌표 대신 이걸 저장한다.
   *
   * 자동으로 갈아끼우지 않고 사용자가 고르게 하는 이유: 정확도 판정(30m)은 도심
   * 빌딩숲에서 오탐이 난다. 게다가 Wi-Fi 측위는 틀린 좌표를 작은 신뢰반경과 함께
   * 자신 있게 돌려주기도 해서, 기계 판정만으로는 옳고 그름을 가릴 수 없다.
   */
  const [pickedCoords, setPickedCoords] = useState<GeoCoords | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const coords = pickedCoords ?? gpsCoords;

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
    if (isSaving) return;
    if (!isValid || selectedEmoji === null) {
      showToast('장소명과 기분 이모지를 입력해 주세요.', 'error');
      return;
    }
    if (!coords) {
      // POST /trees 에 좌표가 필수라 확보될 때까지 막고 위치를 다시 요청한다.
      showToast('현재 위치를 확인하는 중이에요. 잠시 후 다시 시도해 주세요.', 'info');
      requestLocation();
      return;
    }

    saveRecord(
      { photo: capturedPhoto, placeName, mood: selectedEmoji, comment, coords },
      {
        onSuccess: () => {
          // 장소만 저장되고 방문 기록은 실패하는 반쪽 상태가 없어졌다 — 나무가 곧 기록이다(#123).
          // 그래서 문구도 하나로 돌아왔다.
          showToast('기록이 저장되었어요.', 'success');
          navigate(ROUTES.home);
        },
        onError: () => {
          showToast('저장에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
        },
      },
    );
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
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[15px] text-white">
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
              <div className="flex-1" />
              <span className="animate-fade-in-down shrink-0 text-[15px] text-white/80">{today}</span>
            </>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                <img src="/apple-touch-icon.jpg" alt="" className="h-6 w-6 rounded-md" />
                <span className="text-lg font-medium">PicTree</span>
              </div>
              <div className="w-9 shrink-0" />
            </>
          )}
        </header>

        {/* 촬영 검토: 중앙 한줄평 + 하단 장소명 바 / 작성 모드 폼 / 라이브 프리뷰(배율 배지) */}
        {capturedPhoto ? (
          <>
            <CommentField comment={comment} onCommentChange={setComment} />
            <PlaceNameBar
              selectedEmoji={selectedEmoji}
              onSelectEmoji={setSelectedEmoji}
              placeName={placeName}
              onPlaceNameChange={setPlaceName}
            />
          </>
        ) : isWriteMode ? (
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
            <button
              onClick={cycleZoom}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white"
            >
              {zoom.toFixed(1)}x
            </button>
          </div>
        )}

        {/* 저장 직전(촬영 검토·작성 모드)에만 위치 상태를 알린다. 라이브 프리뷰에서는
            아직 저장할 것이 없어 위치를 따질 이유가 없다. */}
        {(capturedPhoto || isWriteMode) && (
          <LocationAccuracyBar
            coords={coords}
            isManual={pickedCoords !== null}
            onPick={() => setIsPickerOpen(true)}
            onReset={() => setPickedCoords(null)}
          />
        )}

        <CameraControls
          hasPhoto={!!capturedPhoto}
          isWriteMode={isWriteMode}
          canSave={isValid}
          isSaving={isSaving}
          onCapture={handleCapture}
          onToggleFacing={toggleFacing}
          onToggleWriteMode={toggleWriteMode}
          onRetake={handleRetake}
          onSave={handleSave}
        />
      </div>

      {isPickerOpen && (
        <LocationPickerSheet
          initialCoords={coords}
          onClose={() => setIsPickerOpen(false)}
          // 토스트를 띄우지 않는다 — 시트가 닫히면 그 자리의 줄이 곧바로
          // '위치를 직접 지정했어요'로 바뀌어 같은 말을 두 번 하게 된다.
          onConfirm={(picked) => {
            setPickedCoords(picked);
            setIsPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
