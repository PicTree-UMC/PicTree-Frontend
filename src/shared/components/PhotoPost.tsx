import type { ReactNode } from 'react';

import { IconFrame } from './IconFrame';
import { Photo } from './Photo';

/** 프로필 아이콘 느낌으로 장소명 앞에 두는 나무 아바타(지도 마커와 같은 에셋). */
const TREE_AVATAR = '/markers/tree.svg';

interface PhotoPostProps {
  /** 머리글 왼쪽, 나무 아바타 옆 — 장소명. 길면 잘린다. */
  title: string;
  /** 머리글 오른쪽 — 날짜. 폭을 안 줄이므로 짧게 넘길 것. */
  meta?: ReactNode;
  /**
   * 대표 사진. 없거나 못 불러오면 `Photo` 가 나무 폴백으로 받는다 —
   * 부르는 쪽에서 대체 이미지를 만들어 넘기지 않는다.
   */
  imageUrl?: string | null;
  /**
   * 사진 아래 액션 줄. `flex items-center` 한 줄 안에 그대로 놓인다 —
   * 오른쪽 끝으로 밀 것은 스스로 `ml-auto` 를 갖는다. 없으면 줄을 안 그린다.
   */
  actions?: ReactNode;
  /** 한줄평. 비어 있으면 캡션 자체를 안 단다. */
  caption?: string | null;
}

/**
 * 인스타 게시물 꼴의 사진 한 칸 — 머리글(나무 아바타 + 장소명 / 날짜) · 사진 ·
 * 액션 줄 · 한줄평.
 *
 * 타임라인 피드와 즐겨찾기(타일을 눌러 여는 게시물)가 같은 얼개를 쓴다. 액션은
 * 화면마다 다르므로(타임라인은 하트·수정·삭제, 즐겨찾기는 해제 하나) 이 컴포넌트는
 * 자리만 내주고 내용은 안 정한다.
 *
 * 좌우 여백을 안 갖는다 — 사진이 화면 끝까지 닿아야 해서 부모가 여백 없이 놓고,
 * 머리글·캡션만 `px-3` 으로 안쪽에서 들여 쓴다.
 */
export function PhotoPost({ title, meta, imageUrl, actions, caption }: PhotoPostProps) {
  return (
    <article>
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EDE7D2]">
          <img src={TREE_AVATAR} alt="" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] text-[#2C3930]">{title}</span>
        {meta && <span className="shrink-0 text-[15px] text-[#60655C]">{meta}</span>}
      </div>

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EDE7D2]">
        <Photo
          src={imageUrl}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          iconClassName="h-14 w-14"
        />
      </div>

      {(actions || caption) && (
        <div className="px-3 pt-2">
          {actions && <div className="flex items-center text-[#2C3930]">{actions}</div>}

          {/* 한줄평은 font-light 로 머리글의 medium 느낌을 뺀다. */}
          {caption && (
            <p className="pt-1 text-[15px] font-light leading-[22px] text-[#2C3930]">
              {caption}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * 게시물 액션 줄의 즐겨찾기 하트. 켜지면 분홍으로 채우고, 꺼지면 외곽선만.
 *
 * 타임라인(토글)과 즐겨찾기(해제)가 같은 글리프를 써야 같은 뜻으로 읽히므로
 * `PhotoPost` 와 한 파일에 둔다.
 */
export function PostHeartIcon({ filled }: { filled: boolean }) {
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
