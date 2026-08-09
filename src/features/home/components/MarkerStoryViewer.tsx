import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { IconFrame, Photo } from '@/shared/components';
import { DeleteMarkerModal } from './DeleteMarkerModal';
import type { MapMarkerData } from '../hooks/useMapMarkers';

interface MarkerStoryViewerProps {
  /** 이 뷰어가 넘겨 볼 나무 목록. 단일 마커는 1개, 클러스터는 묶인 개수만큼. */
  markers: MapMarkerData[];
  /** 지금 보고 있는 슬라이드 위치. */
  activeIndex: number;
  /** 좌우로 넘겨 다른 슬라이드로 이동. */
  onNavigate: (index: number) => void;
  onClose: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

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
 * 닫기는 우상단 X 버튼(또는 Esc)로만 — 사진을 탭해도 닫히지 않는다.
 */
export function MarkerStoryViewer({
  markers,
  activeIndex,
  onNavigate,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}: MarkerStoryViewerProps) {
  const { data: profile } = useMyProfile();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [favBump, setFavBump] = useState(false);

  const marker = markers[activeIndex];

  // 가로 스크롤 스냅 컨테이너. 스크롤 위치로 현재 슬라이드를 판단하고(onScroll),
  // 밖에서 activeIndex 가 바뀌면(삭제·키보드) 해당 슬라이드로 맞춰 스크롤한다.
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex) onNavigate(index);
  };

  // activeIndex 가 스크롤과 어긋나면(삭제로 슬라이드가 빠지거나 키보드로 이동) 맞춰 준다.
  // 즉시 점프(behavior 'auto')로 이동해 중간 슬라이드에서 onScroll 이 튀지 않게 한다.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const target = activeIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 1) el.scrollTo({ left: target });
  }, [activeIndex]);

  const handleToggleFavorite = () => {
    // 즐겨찾기로 켜질 때만 팝(인스타 좋아요 느낌). 해제 시엔 조용히.
    if (!marker.isFavorite) setFavBump(true);
    onToggleFavorite();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && activeIndex > 0) onNavigate(activeIndex - 1);
      else if (e.key === 'ArrowRight' && activeIndex < markers.length - 1)
        onNavigate(activeIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <>
      <div
        className="animate-fade-in fixed inset-0 z-50 mx-auto overflow-hidden bg-neutral-950 sm:max-w-[390px]"
        role="dialog"
        aria-modal="true"
      >
        {/*
          슬라이드들을 가로로 깔고 스크롤-스냅으로 한 장씩 넘긴다.
          닫기는 우상단 X(또는 Esc)로만 — 사진을 아무 데나 탭해도 닫히지 않는다.
        */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        >
          {markers.map((item) => (
            <div key={item.id} className="relative h-full w-full shrink-0 snap-center">
              {item.photo ? (
                /*
                  사진이 화면의 전부인 자리라 폴백에 문구를 함께 세운다 — 나무 아이콘만
                  덩그러니 두면 **사진 없이 저장한 기록(아래 이모지 자리)과 구별이 안 된다.**
                  그래서 `src` 가 없는 경우는 여기 안 태우고 이모지 분기로 그대로 둔다.
                */
                <Photo
                  src={item.photo}
                  alt={item.label}
                  className="absolute inset-0 h-full w-full object-cover"
                  iconClassName="h-16 w-16"
                  message="사진을 불러오지 못했어요"
                  messageClassName="text-[13px] text-white/70"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl opacity-80">{item.emoji}</span>
                </div>
              )}
            </div>
          ))}
        </div>

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
              {/* 프로필 아이콘은 정적, 캡슐형 말풍선만 둥둥 뜬다.
                  프로필 사진이 없거나 못 불러오면 나무로 떨어진다. */}
              <Photo
                src={profile?.profileImageUrl}
                className="h-8 w-8 shrink-0 rounded-full bg-white/15 object-cover"
                iconClassName="h-5 w-5"
              />
              <p className="animate-bubble-float mb-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium leading-snug text-neutral-900">
                {marker.comment}
              </p>
            </div>
          )}

          {/* 좌: 즐겨찾기 / 중앙: 점 인디케이터 / 우: 수정·삭제 */}
          <div className="grid grid-cols-3 items-center text-white">
            <div className="justify-self-start">
              <button
                onClick={handleToggleFavorite}
                aria-label="즐겨찾기"
                aria-pressed={!!marker.isFavorite}
                className="-ml-1 p-1"
              >
                {/*
                  하트 팝 애니메이션용 래퍼. `inline-block` 이면 글자 베이스라인에 얹혀
                  옆 아이콘보다 몇 px 높게 앉는다 — `block` 으로 두어야 줄이 맞는다.
                */}
                <span
                  className={`block ${favBump ? 'animate-heart-pop' : ''}`}
                  onAnimationEnd={() => setFavBump(false)}
                >
                  <HeartIcon filled={!!marker.isFavorite} />
                </span>
              </button>
            </div>

            {/*
              점 인디케이터 — 그룹에 묶인 나무 수만큼, 현재 슬라이드는 길게 강조.
              한 그루뿐이면 그리지 않는다. 점 하나가 길쭉한 막대로 그려져 가운데에
              구분선처럼 남는다.
            */}
            <div className="flex justify-center gap-1.5 justify-self-center">
              {markers.length > 1 &&
                markers.map((item, i) => (
                  <span
                    key={item.id}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
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
    <IconFrame
      box={{ cx: 12, cy: 12, h: 16.5 }}
      fill={filled ? '#ff4d6d' : 'none'}
      stroke={filled ? '#ff4d6d' : 'currentColor'}
      aria-hidden
    >
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </IconFrame>
  );
}

function PencilIcon() {
  return (
    <IconFrame box={{ cx: 13.8, cy: 10.4, h: 15.2 }} aria-hidden>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M19.5 7.125L16.875 4.5" />
    </IconFrame>
  );
}

function TrashIcon() {
  return (
    <IconFrame box={{ cx: 12, cy: 13, h: 18 }} aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3" />
    </IconFrame>
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
