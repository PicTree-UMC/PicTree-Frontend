import { createPortal } from "react-dom";

import { NavBar, PhotoPost, PostHeartIcon } from "@/shared/components";
import type { FavoritePlace } from "../types/favorite";

interface Props {
  place: FavoritePlace;
  onClose: () => void;
  /** 하트를 눌렀을 때. 확인창은 부모가 띄운다. */
  onRemove: () => void;
}

/** `"2026-03-30"` → `"2026년 3월 30일"`. 모르는 꼴이면 원본 그대로 보여 준다. */
const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

/**
 * 격자에서 타일을 눌렀을 때 여는 게시물 화면.
 *
 * 타임라인 피드와 **같은 `PhotoPost` 얼개**를 쓴다 — 격자에서 사진 하나를 골라
 * 크게 보는 동작이라, 다른 모양으로 열면 같은 앱의 다른 화면처럼 읽힌다.
 * 액션은 하트 하나뿐이다: 즐겨찾기 화면이라 이미 담긴 상태(채워진 하트)이고,
 * 누르면 해제로 간다. 나무 상세 라우트가 없어서 수정·삭제는 여기 없다.
 *
 * 결제 화면과 같은 방식으로 body 에 붙인다 — `AppShell` 안에 두면 셸 컬럼의
 * 크림 배경·탭바와 층이 얽힌다(`PaymentCheckoutView` 주석 참고).
 */
export function FavoritePostView({ place, onClose, onRemove }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 mx-auto flex w-full flex-col bg-[#FFFCEF] sm:max-w-[390px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${place.name} 게시물`}
    >
      <header className="shrink-0 px-5 pb-3 pt-header">
        <NavBar onBack={onClose} backLabel="닫기" title="즐겨찾기 장소" />
      </header>

      {/* 좌우 여백이 없다 — 사진이 화면 끝까지 닿는 게 게시물 얼개의 전제다. */}
      <div className="flex-1 overflow-y-auto pb-8">
        <PhotoPost
          title={place.name}
          meta={formatDate(place.createdAt)}
          // 사진이 없거나 못 불러오면 타임라인과 같은 나무 폴백으로 떨어진다(PhotoPost 안).
          imageUrl={place.imageUrl}
          caption={place.description}
          actions={
            <button
              type="button"
              onClick={onRemove}
              aria-label="즐겨찾기 해제"
              className="-ml-1 p-1 transition active:scale-90"
            >
              <PostHeartIcon filled />
            </button>
          }
        />
      </div>
    </div>,
    document.body,
  );
}
