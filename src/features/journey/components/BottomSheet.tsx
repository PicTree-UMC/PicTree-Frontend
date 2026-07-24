import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { Journey } from '../types/journey';
import { PlaceTrail } from './PlaceTrail';

interface BottomSheetProps {
  journey: Journey;
  onClose: () => void;
  onMapView: () => void;
  onPhotoGallery: () => void;
  onAIBlog: () => void;
  onRename: () => void;
  /**
   * 열릴 때 슬라이드업/페이드인 재생 여부. 기본 true.
   * 사진 앨범에서 되돌아오는 경우처럼 이미 시트가 떠 있던 맥락에서는 false로 꺼서
   * 딤이 다시 깜빡이거나 시트가 아래에서 재등장하지 않게 한다.
   */
  animateIn?: boolean;
}

const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** 지도에서 보기(solar:map-linear) */
function MapIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

/** 사진 앨범(tabler:photo) */
function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9" r="1.3" />
      <path d="m3 17 5-4 4 3 3-2 6 5" />
    </svg>
  );
}

/** AI 블로그 작성(solar:book-linear) */
function BookIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M6 3h13a1 1 0 0 1 1 1v14H7a3 3 0 0 0-3 3V6a3 3 0 0 1 3-3Z" />
      <path d="M4 18a3 3 0 0 0 3 3h13" />
    </svg>
  );
}

/** 이름 변경(lucide:pen-line) */
function PenIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

interface SheetMenuItemProps {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}

function SheetMenuItem({ icon, title, desc, onClick }: SheetMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 py-3 text-left text-[#2c3930]"
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#111]">{title}</span>
        <span className="block text-[11px] font-medium text-[#2c3930]">{desc}</span>
      </span>
    </button>
  );
}

export function BottomSheet({
  journey,
  onClose,
  onMapView,
  onPhotoGallery,
  onAIBlog,
  onRename,
  animateIn = true,
}: BottomSheetProps) {
  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 ${animateIn ? 'animate-fade-in' : ''}`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto rounded-t-[20px] bg-[#fffcef] px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 sm:max-w-[390px] ${animateIn ? 'animate-slide-up-sheet' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {/* 홈 인디케이터 핸들 */}
        <div className="mx-auto mb-4 h-[5px] w-[134px] rounded-full bg-[#111]" />

        {/* 헤더: 제목 + 날짜, 미니 동선 */}
        <div className="flex items-baseline gap-2.5">
          <h2 className="truncate text-xl font-bold text-[#111]">{journey.title}</h2>
          <span className="shrink-0 text-xs font-medium text-[#2c3930]">{journey.date}</span>
        </div>
        <PlaceTrail places={journey.places} className="mt-4" />

        <hr className="my-4 border-t border-[#e5e5e5]" />

        {/* 메뉴 */}
        <div className="flex flex-col">
          <SheetMenuItem
            icon={<MapIcon className="size-[30px]" />}
            title="지도에서 보기"
            desc="옵션을 지도 위에서 확인해요"
            onClick={onMapView}
          />
          <SheetMenuItem
            icon={<PhotoIcon className="size-[30px]" />}
            title="사진 앨범"
            desc="이 경로의 사진을 모아볼 수 있어요"
            onClick={onPhotoGallery}
          />
          <SheetMenuItem
            icon={<BookIcon className="size-[30px]" />}
            title="AI 블로그 작성"
            desc="이 동선으로 여행 블로그를 생성해요"
            onClick={onAIBlog}
          />
          <SheetMenuItem
            icon={<PenIcon className="size-[30px]" />}
            title="이름 변경"
            desc="동선의 이름을 수정해요"
            onClick={onRename}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
