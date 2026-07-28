import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MapMarkerData } from '../hooks/useMapMarkers';

interface MarkerDetailSheetProps {
  marker: MapMarkerData;
  onClose: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 지도 마커를 탭했을 때 뜨는 상세정보 바텀시트. 딤드+슬라이드업 카드 구조는 journey BottomSheet 와 동일한 셸을 차용.
 *
 * ⚠️ 되돌리지 말 것 — 아래 3가지는 전부 이슈 #39(모바일에서 시트 하단이 잘림)의 원인이었다.
 *  1) createPortal + z-50: 예전엔 Layout 안에 인라인으로 그려지고 z-40 이었다. 탭바도 z-40 인데
 *     DOM 상 <Outlet/> 뒤에 있어(= 나중에 페인트) 같은 z-index 면 탭바가 이긴다. 그래서 사진 하단과
 *     수정/삭제 버튼이 탭바에 덮여 누를 수 없었다. body 로 빼고 z-50 을 줘야 딤까지 탭바 위에 온다.
 *  2) mx-auto sm:max-w-[390px]: 없으면 데스크톱에서 시트만 창 전체 폭으로 퍼져 컬럼과 어긋난다.
 *  3) max-h + 내부 스크롤 + safe-area: 세로 사진이면 시트가 뷰포트를 넘긴다. 넘치는 건 시트 안에서
 *     스크롤하고 버튼은 항상 바닥에 남아야 한다. 포털로 body 에 붙으므로 여기선 dvh 를 써도 된다
 *     (AppShell 컬럼 밖이라 "뷰포트 단위는 AppShell 만" 규칙의 예외).
 */
export function MarkerDetailSheet({
  marker,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}: MarkerDetailSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      {/* 배경 딤드 */}
      <div className="animate-fade-in fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* 바텀시트 */}
      <div
        className="animate-slide-up-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-t-2xl bg-white px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:max-w-[390px]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between">
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

        {/* 사진·코멘트만 스크롤한다. 헤더와 버튼은 시트에 고정 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {marker.photo && (
            <div className="mt-3">
              <img src={marker.photo} alt={marker.label} className="w-full rounded-xl" />
            </div>
          )}

          <p className="mt-3 text-sm text-neutral-600">{marker.comment}</p>
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
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
    </>,
    document.body,
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
