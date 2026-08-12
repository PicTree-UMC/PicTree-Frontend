import { useEffect, useRef, useState, type ReactNode } from 'react';

import { IconFrame } from './IconFrame';
import { Photo } from './Photo';

/** 프로필 아이콘 느낌으로 장소명 앞에 두는 나무 아바타(지도 마커와 같은 에셋). */
const TREE_AVATAR = '/markers/tree.svg';

/**
 * 점으로 자리를 보여 줄 수 있는 최대 장수.
 *
 * 이보다 많으면 점이 촘촘해져 몇 번째인지 못 읽는다 — 그때는 점을 접고
 * `n/N` 알약을 계속 띄운다.
 */
const MAX_DOTS = 8;

/** 넘긴 뒤 `n/N` 알약이 남아 있는 시간(ms). */
const COUNTER_LINGER_MS = 1200;

export interface PhotoPostSlide {
  /** 리스트 key. 기록 id 를 그대로 넘기면 된다. */
  key: string;
  url?: string | null;
  alt?: string;
}

interface PhotoPostProps {
  /** 머리글 왼쪽, 나무 아바타 옆 — 장소명. 길면 잘린다. */
  title: string;
  /** 머리글 오른쪽 — 날짜. 폭을 안 줄이므로 짧게 넘길 것. */
  meta?: ReactNode;
  /**
   * 대표 사진. 없거나 못 불러오면 `Photo` 가 나무 폴백으로 받는다 —
   * 부르는 쪽에서 대체 이미지를 만들어 넘기지 않는다.
   *
   * `photos` 를 주면 무시된다.
   */
  imageUrl?: string | null;
  /**
   * 옆으로 넘겨 보는 사진들. 주면 `imageUrl` 대신 이쪽을 그린다.
   *
   * ⚠️ **몇 번째를 보고 있는지는 이 컴포넌트가 갖지 않는다.** 넘긴 장에 맞춰
   * `title`·`caption`·`actions` 까지 바뀌어야 하는데(타임라인은 한 장 한 장이
   * 서로 다른 기록이다) 그 값을 아는 건 부르는 쪽이다. 여기서는 스크롤 위치를
   * 읽어 `onActiveIndexChange` 로 올려보내기만 한다.
   */
  photos?: PhotoPostSlide[];
  /** `photos` 를 쓸 때 현재 장. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  /**
   * 사진 아래 액션 줄. `flex items-center` 한 줄 안에 그대로 놓인다 —
   * 오른쪽 끝으로 밀 것은 스스로 `ml-auto` 를 갖는다. 없으면 줄을 안 그린다.
   */
  actions?: ReactNode;
  /** 한줄평. 비어 있으면 캡션 자체를 안 단다. */
  caption?: string | null;
}

/**
 * 여러 장을 옆으로 넘겨 보는 사진 자리 — 스크롤 스냅 한 칸이 사진 한 장이다.
 *
 * 라이브러리를 안 쓴다. 브라우저의 스냅이 관성·되돌림을 이미 처리하고, 지도
 * 스토리 뷰어(`MarkerStoryViewer`)도 같은 얼개다.
 *
 * `PhotoPost` 안에서만 쓰다가 밖으로 열었다 — 동선의 사진 앨범(`RoutePhotoAlbum`)이
 * **넘기는 방식만** 같아야 하고 게시물 머리글(나무 아바타·장소명 줄)은 필요 없기 때문이다.
 * 넘기는 감각이 화면마다 갈리지 않게, 복사하지 말고 이걸 쓸 것.
 */
export function PhotoStrip({
  slides,
  activeIndex,
  onActiveIndexChange,
  className = '',
  dotsInside = false,
}: {
  slides: PhotoPostSlide[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /**
   * 사진 칸 바깥틀에만 붙는다(사진 아래 점 줄은 제외) — 모서리를 둥글리는 자리.
   * 게시물은 화면 끝까지 닿아 각진 채로 두고, 여백 안에 놓이는 앨범은 둥글린다.
   */
  className?: string;
  /**
   * 점을 사진 **안** 아래쪽에 얹는다. 기본은 사진 밑에 한 줄로 놓는 것.
   *
   * 게시물(타임라인)은 사진 아래에 액션 줄·한줄평이 이어지므로 점도 그 흐름의 첫 줄로
   * 두는 게 맞다. 반면 앨범은 사진 한 칸이 섹션의 전부라, 점이 밖에 있으면 사진과
   * 아래 섹션 사이에 정체 모를 8px 짜리 줄이 하나 끼는 꼴이 된다.
   *
   * 얹을 땐 흰 점 + 그림자다 — 사진이 무엇이든(하늘·눈밭) 흰 점만으로는 사라질 수 있어
   * 획 주변에만 그늘을 깐다(지도 위 제목의 외곽선과 같은 수법).
   */
  dotsInside?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;

    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex) onActiveIndexChange(index);

    // 넘기는 동안만 알약을 띄우고, 손을 뗀 뒤 잠깐 있다 사라진다.
    setIsSwiping(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIsSwiping(false), COUNTER_LINGER_MS);
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  /*
   * 밖에서 장이 바뀌면(기록이 지워져 목록이 짧아질 때) 스크롤을 맞춘다.
   *
   * ⚠️ **반 칸 넘게 어긋났을 때만 건드린다.** 손가락으로 넘기는 중에는 반 칸을
   * 지나는 순간 `activeIndex` 가 먼저 바뀌는데, 그때 끼어들어 `scrollTo` 를 부르면
   * 브라우저가 그리던 스냅 애니메이션을 끊어 화면이 툭 끊긴다. 밖에서 온 변경은
   * 한 칸 단위라 이 문턱에 안 걸린다.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const target = activeIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > el.clientWidth / 2) el.scrollTo({ left: target });
  }, [activeIndex]);

  // 점을 못 그릴 만큼 많으면 알약을 계속 띄워 둔다 — 자리를 알 방법이 그것뿐이다.
  const isDotted = slides.length <= MAX_DOTS;
  const showCounter = !isDotted || isSwiping;

  const dots = isDotted && (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-1.5 ${
        dotsInside ? 'pointer-events-none absolute inset-x-0 bottom-3' : 'pt-2'
      }`}
    >
      {slides.map((slide, i) => (
        <span
          key={slide.key}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            dotsInside
              ? `shadow-[0_0_3px_rgba(0,0,0,0.45)] ${i === activeIndex ? 'bg-white' : 'bg-white/50'}`
              : i === activeIndex
                ? 'bg-pictree-700'
                : 'bg-ink/20'
          }`}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className={`relative ${className}`}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          /*
            overscroll-x-contain: 끝 장에서 더 밀 때 스크롤이 페이지 밖으로 이어져
            브라우저 뒤로가기 제스처가 걸리는 것을 막는다.
          */
          className="no-scrollbar flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
        >
          {slides.map((slide) => (
            <div
              key={slide.key}
              /*
                snap-always(`scroll-snap-stop: always`): 세게 튕겨도 한 칸에서 반드시
                멈춘다. 이게 없으면 관성이 붙는 만큼 두세 장이 한 번에 넘어가는데,
                여기서 넘기는 한 장은 각각 다른 기록이라 **읽지도 못한 기록이
                지나가 버린다.** 사진 여러 장이 한 게시물인 인스타와 다른 점이다.
              */
              className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden bg-cream-deep"
            >
              <Photo
                src={slide.url}
                alt={slide.alt ?? ''}
                className="absolute inset-0 h-full w-full object-cover"
                iconClassName="h-14 w-14"
              />
            </div>
          ))}
        </div>

        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[13px] text-white transition-opacity duration-200 ${
            showCounter ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeIndex + 1}/{slides.length}
        </span>

        {dotsInside && dots}
      </div>

      {!dotsInside && dots}
    </>
  );
}

/**
 * 인스타 게시물 꼴의 사진 한 칸 — 머리글(나무 아바타 + 장소명 / 날짜) · 사진 ·
 * 액션 줄 · 한줄평.
 *
 * 타임라인 피드와 즐겨찾기(타일을 눌러 여는 게시물)가 같은 얼개를 쓴다. 액션은
 * 화면마다 다르므로(타임라인은 하트·수정·삭제, 즐겨찾기는 해제 하나) 이 컴포넌트는
 * 자리만 내주고 내용은 안 정한다.
 *
 * 사진은 한 장(`imageUrl`)일 수도, 옆으로 넘기는 여러 장(`photos`)일 수도 있다.
 * 넘기는 쪽은 점·`n/N` 알약이 따라붙는다.
 *
 * 좌우 여백을 안 갖는다 — 사진이 화면 끝까지 닿아야 해서 부모가 여백 없이 놓고,
 * 머리글·캡션만 `px-3` 으로 안쪽에서 들여 쓴다.
 */
export function PhotoPost({
  title,
  meta,
  imageUrl,
  photos,
  activeIndex = 0,
  onActiveIndexChange,
  actions,
  caption,
}: PhotoPostProps) {
  const isStrip = !!photos && photos.length > 0;

  return (
    <article>
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-deep">
          <img src={TREE_AVATAR} alt="" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{title}</span>
        {meta && <span className="shrink-0 text-[15px] text-ink-muted">{meta}</span>}
      </div>

      {isStrip ? (
        <PhotoStrip
          slides={photos}
          activeIndex={activeIndex}
          onActiveIndexChange={onActiveIndexChange ?? (() => {})}
        />
      ) : (
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-deep">
          <Photo
            src={imageUrl}
            className="absolute inset-0 h-full w-full object-cover"
            iconClassName="h-14 w-14"
          />
        </div>
      )}

      {(actions || caption) && (
        <div className="px-3 pt-2">
          {actions && <div className="flex items-center text-ink">{actions}</div>}

          {/* 한줄평은 font-light 로 머리글의 medium 느낌을 뺀다. */}
          {caption && (
            <p className="pt-1 text-[15px] font-light leading-[22px] text-ink">
              {caption}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * 즐겨찾기 하트 버튼 — 누르면 팝하고 토글을 부른다.
 *
 * 타임라인·즐겨찾기·지도 스토리 뷰어가 같이 쓴다. 예전에는 팝 애니메이션이
 * 스토리 뷰어에만 있었고, 그 배선(state · 클래스 토글 · `onAnimationEnd` 리셋)이
 * 화면 안에 흩어져 있어 다른 화면이 쓰려면 통째로 복사해야 했다.
 *
 * ⚠️ **팝은 `filled` 의 변화가 아니라 탭에 건다.** `filled` 는 내 탭 말고도 바뀐다 —
 * 지도에서 즐겨찾기하고 타임라인으로 돌아오거나, 토글 뒤 재조회가 값을 덮을 때도
 * 바뀐다. 그 변화에 팝을 걸면 **건드리지도 않은 하트가 혼자 팝한다.** 그래서 공용으로
 * 뽑는 단위가 아이콘이 아니라 버튼이다.
 *
 * 켤 때만 팝한다 — 해제는 조용히 넘어간다. 없애는 동작에 축하 연출을 붙이면
 * 뜻이 어긋난다.
 *
 * 낙관적 갱신이라 탭 즉시 `filled` 가 뒤집히고, 서버가 실패하면 되돌아온다. 그때
 * 팝은 이미 재생된 뒤다 — **팝은 서버가 받아들였다는 신호가 아니라 내 탭에 대한
 * 반응이므로** 그대로 둔다. 실패는 토글 훅의 토스트가 알린다.
 */
export function FavoriteHeartButton({
  filled,
  onToggle,
  label,
  className = '',
}: {
  filled: boolean;
  onToggle: () => void;
  /** 낭독기용 이름. 화면마다 뜻이 달라(토글 / 해제) 부르는 쪽이 정한다. */
  label: string;
  /** 자리 보정용. 여백·정렬만 넘길 것 — 크기와 눌린 티는 이 버튼이 갖는다. */
  className?: string;
}) {
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = () => {
    if (!filled) setIsPopping(true);
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={filled}
      className={`p-1 transition active:scale-90 ${className}`}
    >
      {/*
        팝 래퍼. `inline-block` 이면 글자 베이스라인에 얹혀 옆 아이콘보다 몇 px
        높게 앉는다 — `block` 으로 두어야 줄이 맞는다.
      */}
      <span
        className={`block ${isPopping ? 'animate-heart-pop' : ''}`}
        onAnimationEnd={() => setIsPopping(false)}
      >
        <PostHeartIcon filled={filled} />
      </span>
    </button>
  );
}

/**
 * 게시물 액션 줄의 즐겨찾기 하트. 켜지면 분홍으로 채우고, 꺼지면 외곽선만.
 *
 * 누르는 자리는 `FavoriteHeartButton` 이다 — 이건 글리프만 그린다.
 *
 * 타임라인(토글)과 즐겨찾기(해제)가 같은 글리프를 써야 같은 뜻으로 읽히므로
 * `PhotoPost` 와 한 파일에 둔다.
 */
export function PostHeartIcon({ filled }: { filled: boolean }) {
  return (
    <IconFrame
      box={{ cx: 12, cy: 12, w: 18, h: 16.5 }}
      fill={filled ? '#ff4d6d' : 'none'}
      stroke={filled ? '#ff4d6d' : 'currentColor'}
      aria-hidden
    >
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </IconFrame>
  );
}
