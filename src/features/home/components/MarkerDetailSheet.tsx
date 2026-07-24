import type { MapMarkerData } from '../hooks/useMapMarkers';

interface MarkerDetailSheetProps {
  marker: MapMarkerData;
  onClose: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 지도 마커를 탭했을 때 뜨는 상세정보 바텀시트. 딤드+슬라이드업 카드 구조는 journey BottomSheet 와 동일한 셸을 차용. */
export function MarkerDetailSheet({
  marker,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}: MarkerDetailSheetProps) {
  return (
    <>
      {/* 배경 딤드 */}
      <div className="animate-fade-in fixed inset-0 z-30 bg-black/50" onClick={onClose} />

      {/* 바텀시트 */}
      <div className="animate-slide-up-sheet fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-lg">
              {marker.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{marker.label}</p>
              <p className="text-xs text-neutral-400">{marker.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onToggleFavorite} aria-label="즐겨찾기">
              <StarIcon filled={!!marker.isFavorite} />
            </button>
            <button onClick={onClose} aria-label="닫기">
              <XIcon />
            </button>
          </div>
        </div>

        {marker.photo && (
          <div className="mt-3">
            <img src={marker.photo} alt={marker.label} className="w-full rounded-xl" />
          </div>
        )}

        <p className="mt-3 text-sm text-neutral-600">{marker.comment}</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded-lg bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700"
          >
            삭제
          </button>
        </div>
      </div>
    </>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? '#f5b400' : 'none'}
      stroke={filled ? '#f5b400' : 'currentColor'}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L12 16.9l-5.21 2.6 1-5.78-4.21-4.1 5.82-.86L12 3.5z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
