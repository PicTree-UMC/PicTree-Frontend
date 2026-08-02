import { LOW_ACCURACY_THRESHOLD_M, type GeoCoords } from '@/shared/hooks/useGeolocation';
import { PinIcon } from './icons';

interface LocationAccuracyBarProps {
  /** 저장에 쓰일 좌표(수동 지정했다면 그것). */
  coords: GeoCoords | null;
  /** 사용자가 지도에서 직접 고른 좌표인지. */
  isManual: boolean;
  onPick: () => void;
  onReset: () => void;
}

/**
 * 촬영 후 저장 직전에 위치 상태를 알리는 줄.
 *
 * **측위가 충분히 정확할 때는 아무것도 띄우지 않는다** — 시안에 없는 UI 라
 * 늘 떠 있으면 화면만 시끄럽다. 오차가 클 때와 수동 지정 상태에서만 나타난다.
 */
export function LocationAccuracyBar({
  coords,
  isManual,
  onPick,
  onReset,
}: LocationAccuracyBarProps) {
  const accuracy = coords?.accuracy;
  const inaccurateMessage =
    accuracy !== undefined && accuracy > LOW_ACCURACY_THRESHOLD_M
      ? `현재 위치 오차가 약 ${Math.round(accuracy)}m 예요. 지하라면 실제와 다를 수 있어요.`
      : null;

  if (!coords || (!isManual && !inaccurateMessage)) return null;

  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-[12px] bg-black/55 px-3 py-2">
      <PinIcon />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-white">
        {isManual ? '위치를 직접 지정했어요.' : inaccurateMessage}
      </p>
      <button
        type="button"
        onClick={isManual ? onReset : onPick}
        className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[13px] text-white"
      >
        {isManual ? '되돌리기' : '직접 지정'}
      </button>
    </div>
  );
}
