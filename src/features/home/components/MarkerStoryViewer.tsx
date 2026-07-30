import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { DeleteMarkerModal } from './DeleteMarkerModal';
import type { MapMarkerData } from '../hooks/useMapMarkers';

interface MarkerStoryViewerProps {
  marker: MapMarkerData;
  onClose: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 프로필 이미지가 없을 때 캡션 아바타로 쓰는 기본 나무 아이콘(마커와 동일 에셋). */
const FALLBACK_AVATAR = '/markers/tree.svg';

/**
 * 지도 마커를 탭했을 때 뜨는 상세 뷰어. 예전 하단 바텀시트(MarkerDetailSheet)를 대체하며,
 * 인스타그램 스토리/하이라이트 뷰어의 레이아웃을 차용했다.
 *  - 대표 사진이 화면 전체를 풀블리드로 꽉 채운다(object-cover).
 *  - 선택한 기분 이모지가 아래에서 위로 떠오른다(스토리 하트 효과 대체).
 *  - 상단: 좌측 = 장소명 · 날짜(가로 배치), 우측 = 닫기(X)만.
 *  - 하단: 한줄평 말풍선(아바타 = 사용자 프로필 사진) + 컨트롤 한 줄
 *    (좌: 즐겨찾기 하트 / 중앙: 점 인디케이터 / 우: 수정·삭제 아이콘).
 *  - 사진이 없으면 어두운 배경에 이모지 플레이스홀더를 중앙에 둔다.
 *
 * 스토리처럼 사진(빈 배경)을 탭하면 닫힌다. 헤더 버튼·하단 스크림 영역은
 * stopPropagation 으로 닫힘에서 제외한다. Esc 로도 닫힌다.
 */
export function MarkerStoryViewer({
  marker,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}: MarkerStoryViewerProps) {
  const { data: profile } = useMyProfile();
  const avatarSrc = profile?.profileImageUrl || FALLBACK_AVATAR;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [favBump, setFavBump] = useState(false);

  const handleToggleFavorite = () => {
    // 즐겨찾기로 켜질 때만 팝(인스타 좋아요 느낌). 해제 시엔 조용히.
    if (!marker.isFavorite) setFavBump(true);
    onToggleFavorite();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <>
      <div
        className="animate-fade-in fixed inset-0 z-50 mx-auto overflow-hidden bg-neutral-950 sm:max-w-[390px]"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        {/* 풀블리드 대표 사진(없으면 이모지 플레이스홀더). 탭하면 닫힌다(스토리 동작). */}
        {marker.photo ? (
          <img
            src={marker.photo}
            alt={marker.label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-80">{marker.emoji}</span>
          </div>
        )}

        {/* 상단 스크림 + 헤더: 좌측 기분 이모지·장소명·날짜(가로) / 우측 닫기 */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/55 to-transparent px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-10">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-base leading-none">{marker.emoji}</span>
            <p className="truncate text-[13px] font-medium text-white drop-shadow">
              {marker.label}
            </p>
            <span className="shrink-0 text-white/40">·</span>
            <p className="shrink-0 text-[13px] text-white/70 drop-shadow">{marker.date}</p>
          </div>
          <button
            onClick={(e) => (stop(e), onClose())}
            aria-label="닫기"
            className="-mr-1 shrink-0 p-1"
          >
            <XIcon />
          </button>
        </div>

        {/* 하단 스크림 + 한줄평 말풍선 + 컨트롤 한 줄 */}
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-14 pb-[max(env(safe-area-inset-bottom),1rem)]"
          onClick={stop}
        >
          {marker.comment && (
            // items-end 로 아바타를 바닥에 고정 → 말풍선 mb-2 는 말풍선만 위로 올려 말풍선처럼 띄운다
            // (items-center 면 mb 가 행 높이를 키워 아바타까지 재정렬되며 딸려 올라감)
            <div className="mb-5 flex items-end gap-2">
              {/* 프로필 아이콘은 정적, 캡슐형 말풍선만 둥둥 뜬다 */}
              <img
                src={avatarSrc}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full bg-white/15 object-cover"
              />
              <p className="animate-bubble-float mb-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-light leading-snug text-neutral-900">
                {marker.comment}
              </p>
            </div>
          )}

          {/* 좌: 즐겨찾기 / 중앙: 점 인디케이터 / 우: 수정·삭제 */}
          <div className="grid grid-cols-3 items-center">
            <div className="justify-self-start">
              <button onClick={handleToggleFavorite} aria-label="즐겨찾기" className="-ml-1 p-1">
                <span
                  className={`inline-block ${favBump ? 'animate-heart-pop' : ''}`}
                  onAnimationEnd={() => setFavBump(false)}
                >
                  <HeartIcon filled={!!marker.isFavorite} />
                </span>
              </button>
            </div>

            <div className="flex justify-center gap-1.5 justify-self-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>

            <div className="flex items-center gap-3 justify-self-end">
              <button onClick={onEdit} aria-label="수정" className="p-1">
                <PencilIcon />
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                aria-label="삭제"
                className="-mr-1 p-1"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <DeleteMarkerModal
          placeName={marker.label}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
        />
      )}
    </>,
    document.body,
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill={filled ? '#ff4d6d' : 'none'}
      stroke={filled ? '#ff4d6d' : 'white'}
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.875 4.5"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
