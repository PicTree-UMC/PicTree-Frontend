import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodayTreeQuota } from '@/features/home/hooks/useTodayTreeQuota';
import { isDailyTreeLimitError } from '@/features/home/lib/treeQuota';
import { getApiErrorMessage } from '@/features/profile/lib/profileError';
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
import { BackIcon } from './components/icons';

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
    카메라가 안 열린 이유는 **두 자리**에 있다(#271).
    - 토스트: 방금 실패했다는 것을 알린다. 저장 실패와 같은 창구라 어디를 보고 있든 눈에 든다.
    - 화면 중앙 문구: 토스트가 2.5초 뒤 사라져도 원인이 남는다. 검은 화면만 남으면 셔터를
      눌러도 아무 일이 없는 이유를 알 길이 없다.
    같은 문구를 두 번 말하는 셈이지만, 하나는 **알림**이고 하나는 **상태**다.

    `error` 가 바뀔 때만 뜬다 — 전면/후면 전환은 `error` 를 null 로 되돌리므로 실패가
    이어질 때만 다시 알린다.
  */
  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  /*
    홈에서 이미 한 번 걸렀지만 여기서 또 본다 — 이 화면은 딥링크로도 열리고, 열어 둔 채
    다른 기기에서 심었거나 자정을 넘겼을 수도 있다. 캐시라 이것도 최종 판정은 아니다
    (그건 저장 시 서버 429 다). 남은 수가 얼마 없을 때는 미리 알려 준다.
  */
  const quota = useTodayTreeQuota();

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
    if (quota.isFull) {
      showToast(
        `오늘은 나무를 ${quota.limit}그루까지 심었어요. 내일 다시 심을 수 있어요.`,
        'error',
      );
      return;
    }
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
        onError: (error) => {
          /*
            하루 한도 초과(429)는 "잠시 후 다시" 가 틀린 안내다 — 오늘은 몇 번을 눌러도
            안 된다. 서버 문구를 그대로 쓰는 이유는 한도 숫자가 응답에만 정확히 있어서다
            (프론트 상수는 베껴 둔 값이라 어긋날 수 있다).
          */
          showToast(
            isDailyTreeLimitError(error)
              ? getApiErrorMessage(
                  error,
                  `오늘은 나무를 ${quota.limit}그루까지 심었어요. 내일 다시 심을 수 있어요.`,
                )
              : '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
            'error',
          );
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
      {/* `whitespace-pre-line` — 문구의 `\n`(원인 / 대처) 을 줄바꿈으로 살린다. 토스트와 같은 규칙. */}
      {error && (
        <p className="absolute inset-0 flex items-center justify-center whitespace-pre-line px-6 text-center text-[15px] leading-6 text-white">
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
        <header className="flex items-center gap-2 px-4 pb-2 pt-header">
          {/* 지도 위 헤더(동선 보기)와 같은 원형 버튼이되, 색은 반전이다 — 사진 위에서는
              INK 면 + 크림 글자(가이드라인 §1.1 '텍스트·반전'). 크림 원을 그대로 얹으면
              화면에서 제일 밝은 덩어리가 돼 피사체보다 먼저 눈에 들어온다.
              그림자는 뺐다 — 어두운 원 아래 검은 그림자는 보이지도 않는다. */}
          <button
            onClick={handleClose}
            aria-label="뒤로가기"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/70 text-cream"
          >
            <BackIcon />
          </button>

          {capturedPhoto ? (
            <>
              <div className="flex-1" />
              <span className="animate-fade-in-down shrink-0 text-[15px] text-white/80">{today}</span>
            </>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {/*
                  ⚠️ `/apple-touch-icon.jpg` 를 쓰면 안 된다 — 1024×1024 · 129,942 B 짜리
                  홈 화면 아이콘 원본이라 24px 자리에 130KB 를 싣게 된다(그 용도로는
                  `index.html`·`manifest.json` 에서 계속 쓰이므로 파일 자체는 남긴다).
                  여기 것은 표시 크기의 3배(72px)로만 뽑은 사본이고 4KB 다.
                */}
                <img
                  src="/assets/app-icon-24@3x.png"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-md"
                />
                <span className="text-lg font-medium">PicTree</span>
              </div>
              {/* 왼쪽 버튼과 같은 폭의 빈 칸 — 가운데 로고가 정말 가운데 오게 한다. */}
              <div className="w-10 shrink-0" />
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

        {/* 남은 한도는 **얼마 안 남았을 때만** 알린다. 20그루 중 19그루가 남은 사람에게
            매번 숫자를 보여줄 이유가 없고, 그러면 정작 임박했을 때도 늘 있던 줄로 읽힌다.
            (한도를 아직 모르면 `remaining` 이 최댓값이라 이 줄은 안 뜬다.) */}
        {(capturedPhoto || isWriteMode) && quota.remaining > 0 && quota.remaining <= 3 && (
          <p className="px-4 pb-1 text-center text-[13px] text-white/80">
            오늘 {quota.remaining}그루 더 심을 수 있어요
          </p>
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
