import { CameraIcon, PencilIcon, SwitchCameraIcon } from './icons';

interface CameraControlsProps {
  hasPhoto: boolean;
  isWriteMode: boolean;
  /** 저장 가능 여부(장소명·이모지 충족). false 면 저장/업로드 버튼 비활성화. */
  canSave: boolean;
  /** 업로드 진행 중이면 버튼을 잠그고 라벨을 바꾼다. */
  isSaving: boolean;
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
  canSave,
  isSaving,
  onCapture,
  onToggleFacing,
  onToggleWriteMode,
  onRetake,
  onSave,
}: CameraControlsProps) {
  const saveDisabled = !canSave || isSaving;
  return (
    <div className="pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
      {hasPhoto ? (
        <div className="flex items-center gap-3 px-4">
          <button
            onClick={onRetake}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-neutral-700/90 py-3 text-[15px] font-medium text-white disabled:opacity-50"
          >
            다시찍기
          </button>
          <button
            onClick={onSave}
            disabled={saveDisabled}
            className="flex-1 rounded-xl bg-[#5B6B38] py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? '업로드 중…' : '업로드'}
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
              disabled={saveDisabled}
              className="col-start-2 col-end-4 rounded-full bg-[#5B6B38] py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
            >
              {isSaving ? '저장 중…' : '저장'}
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
