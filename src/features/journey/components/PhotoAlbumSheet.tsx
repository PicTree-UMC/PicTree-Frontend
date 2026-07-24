import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { Journey } from '../types/journey';

/** 뒤로 가기(tabler:chevron-left) */
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

interface PhotoAlbumSheetProps {
  journey: Journey;
  onClose: () => void;
}

/**
 * 동선의 사진 앨범. 동선 목록 위에 딤과 함께 덮이는 전체 높이 시트.
 * 상단 80px는 뒤 화면이 비치도록 비워 둔다(시안 기준).
 */
export function PhotoAlbumSheet({ journey, onClose }: PhotoAlbumSheetProps) {
  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 animate-fade-in bg-black/60" onClick={onClose} />

      <div
        className="fixed inset-x-0 bottom-0 top-20 z-50 mx-auto flex animate-slide-up-sheet flex-col overflow-hidden rounded-t-[20px] bg-[#fffcef] shadow-[0_-4px_6px_0_rgba(0,0,0,0.12)] sm:max-w-[390px]"
        role="dialog"
        aria-modal="true"
        aria-label={`${journey.title} 사진 앨범`}
      >
        {/* 헤더: 뒤로 가기 + 동선 이름 + 날짜 */}
        <header className="flex h-[70px] shrink-0 items-center gap-[11px] bg-[#f6f0d7] px-[17px]">
          <button onClick={onClose} className="shrink-0 text-[#111]" aria-label="뒤로 가기">
            <ChevronLeftIcon className="size-[30px]" />
          </button>
          <h2 className="truncate text-xl font-bold tracking-[0.2px] text-[#111]">
            {journey.title}
          </h2>
          <span className="shrink-0 text-xs font-medium tracking-[0.12px] text-[#2c3930]">
            {journey.date}
          </span>
        </header>

        {/* 본문: 사진 개수 + 2열 그리드 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-[22px]">
          <p className="text-base font-semibold tracking-[0.16px] text-black">
            방문한 장소 사진 <span className="ml-2 text-[#5c6f2b]">{journey.photos.length}</span>
          </p>

          {journey.photos.length === 0 ? (
            <p className="mt-[22px] text-sm font-medium text-[#2c3930]">
              이 동선에는 아직 사진이 없어요
            </p>
          ) : (
            <ul className="mt-[22px] grid grid-cols-2 gap-5">
              {journey.photos.map((photo) => (
                <li key={photo.id} className="aspect-square overflow-hidden bg-[#d9d9d9]">
                  {photo.url && (
                    <img
                      src={photo.url}
                      alt={photo.placeName ?? ''}
                      className="size-full object-cover"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
