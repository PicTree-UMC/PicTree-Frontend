import { CameraIcon, PencilIcon, SwitchCameraIcon } from './icons';

interface CameraControlsProps {
  hasPhoto: boolean;
  isWriteMode: boolean;
  onCapture: () => void;
  onToggleFacing: () => void;
  onToggleWriteMode: () => void;
  onRetake: () => void;
  onSave: () => void;
}

/** 하단 컨트롤 바. 검토/작성/촬영 모드에 따라 버튼 구성이 달라진다. */
export function CameraControls({
  hasPhoto,
  isWriteMode,
  onCapture,
  onToggleFacing,
  onToggleWriteMode,
  onRetake,
  onSave,
}: CameraControlsProps) {
  return (
    <div className="pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
      {hasPhoto ? (
        <div className="flex items-center gap-3 px-4">
          <button
            onClick={onRetake}
            className="flex-1 rounded-xl bg-neutral-700/90 py-3 text-sm font-medium text-white"
          >
            다시찍기
          </button>
          <button
            onClick={onSave}
            className="flex-1 rounded-xl bg-pictree-500 py-3 text-sm font-semibold text-white"
          >
            업로드
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-5">
          <button
            onClick={onToggleWriteMode}
            aria-label={isWriteMode ? '카메라로 전환' : '사진 없이 기록하기'}
            className="col-start-1 flex h-11 w-11 items-center justify-center text-white"
          >
            {isWriteMode ? <CameraIcon /> : <PencilIcon />}
          </button>

          {isWriteMode ? (
            <button
              onClick={onSave}
              className="col-start-2 col-end-4 rounded-full bg-pictree-500 py-3 text-sm font-semibold text-white"
            >
              저장
            </button>
          ) : (
            <>
              <button
                onClick={onCapture}
                aria-label="촬영"
                className="col-start-2 h-16 w-16 justify-self-center rounded-full border-4 border-white bg-white"
              />
              <button
                onClick={onToggleFacing}
                aria-label="전/후면 전환"
                className="col-start-3 flex h-11 w-11 items-center justify-center text-white"
              >
                <SwitchCameraIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
