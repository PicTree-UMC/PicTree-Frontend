import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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
  frameClassName = 'aspect-[4/5]',
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
   * 앨범은 사진 한 칸이 섹션의 전부라, 점이 밖에 있으면 사진과 아래 섹션 사이에
   * 정체 모를 8px 짜리 줄이 하나 끼는 꼴이 된다.
   *
   * ⚠️ **게시물도 얹는 쪽으로 바뀌었다.** 종전에는 "사진 아래로 액션 줄·한줄평이
   * 이어지니 점도 그 흐름의 첫 줄" 이라는 이유로 밖에 뒀는데, 게시물 하나가 한 화면에
   * 들어가야 한다는 조건이 생기면서 그 14px 이 사진에 주는 편이 나아졌다.
   *
   * 얹을 땐 흰 점 + 그림자다 — 사진이 무엇이든(하늘·눈밭) 흰 점만으로는 사라질 수 있어
   * 획 주변에만 그늘을 깐다(지도 위 제목의 외곽선과 같은 수법).
   */
  dotsInside?: boolean;
  /**
   * 사진 칸(가로 스크롤러)의 높이를 정하는 클래스. 기본은 4:5.
   *
   * 게시물은 바깥틀(`className`)이 `.post-photo` 로 높이를 정하므로 여기에 `h-full` 을
   * 넘긴다 — 동선 앨범은 한 화면에 들어가야 할 이유가 없어 기본값을 그대로 쓴다.
   */
  frameClassName?: string;
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

  /*
   * 장 목록 자체가 갈리면(순서가 뒤집히거나 장이 드나들면) 스크롤을 지금 장에 다시 박는다.
   *
   * ⚠️ **위의 `activeIndex` effect 만으로는 못 잡는다.** 칸을 재사용한 채 자식만 다시
   * 늘어놓으면 브라우저가 **스냅을 스스로 다시 맞춰서**, 붙잡고 있던 사진을 따라
   * 스크롤이 혼자 움직인다. 타임라인 정렬을 뒤집을 때 실제로 그랬다 — 4장짜리 하루의
   * 2번째 장을 보다 정렬을 바꾸면 그 사진이 3번째 자리로 가고 스크롤이 거기까지
   * 따라가, **머리글은 1번 장소인데 화면엔 3번째 사진**이 남았다(화면에 보이는 칸에서만
   * 났다 — 안 보이는 칸은 브라우저가 손대지 않는다). `activeIndex` 가 안 바뀌는 경우도
   * 있어서 그 effect 는 아예 돌지도 않는다.
   *
   * 문턱을 두지 않는 이유: 목록이 바뀌는 순간은 손으로 넘기는 중이 아니라, 위 effect 가
   * 스냅 애니메이션을 끊지 않으려고 반 칸 문턱을 뒀던 사정이 여기엔 없다.
   *
   * `useLayoutEffect` 다 — 그린 뒤에 고치면 어긋난 프레임이 한 번 보인다.
   */
  const slideOrder = slides.map((slide) => slide.key).join('|');
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    el.scrollTo({ left: activeIndex * el.clientWidth });
    // activeIndex 는 "어디로 되돌릴지" 일 뿐 이 effect 를 부르는 계기가 아니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideOrder]);

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
          className={`no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain ${frameClassName}`}
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

        {/*
          ⚠️ **두 번 옮겼다: 우상단 → 우하단 → 좌하단.** 처음은 게시물이 머리글(장소명 ·
          날짜)을 사진 위에 얹으면서 그 자리를 날짜에 내준 것이고, 이번엔 동선 목록의
          AI 블로그 버튼(`BlogCreateFab`)이 우하단을 덮어서다.

          그 버튼은 `fixed` + `right-5` + 56px 라 화면 오른쪽 20~76px 를 차지하는데,
          앨범의 알약은 `right-3` 에 좌우 여백 20px 인 자리라 거의 정확히 같은 띠에 든다.
          앨범은 스크롤되고 버튼은 안 움직이므로, 훑다 보면 알약이 버튼 밑을 지나간다.

          왼쪽은 두 화면 다 비어 있고(게시물의 머리글은 위, 액션 줄은 사진 밖이다),
          가운데 점(`dotsInside`)과도 좌우로 안 겹친다.
        */}
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[13px] text-white transition-opacity duration-200 ${
            showCounter ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeIndex + 1}/{slides.length}
        </span>

        {/*
          점을 사진 안에 얹을 때만 아래에도 그늘을 깐다. 흰 점 + 획 그늘만으로는
          눈밭·흰 벽처럼 밝은 사진에서 점이 사라진다(머리글을 얹으며 위에 깐 것과 같은
          이유). 점이 사진 밖에 있는 앨범은 받칠 것이 없으므로 깔지 않는다.

          ⚠️ `isDotted` 도 같이 본다 — 점을 접는 장수(9 장 이상)에서는 받칠 점이 없고,
          그 자리를 대신하는 `n/N` 알약은 제 배경을 갖고 있다. 안 그러면 사진 아래쪽만
          이유 없이 어두워진다.
        */}
        {dotsInside && isDotted && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent"
          />
        )}
        {dotsInside && dots}
      </div>

      {!dotsInside && dots}
    </>
  );
}

/**
 * 인스타 게시물 꼴의 사진 한 칸 — 사진(위에 머리글이 얹힌다) · 액션 줄 · 한줄평.
 *
 * 타임라인 피드와 즐겨찾기(타일을 눌러 여는 게시물)가 같은 얼개를 쓴다. 액션은
 * 화면마다 다르므로(타임라인은 하트·수정·삭제, 즐겨찾기는 해제 하나) 이 컴포넌트는
 * 자리만 내주고 내용은 안 정한다.
 *
 * ⚠️ **머리글(나무 아바타 + 장소명 / 날짜)은 사진 위에 얹는다.** 종전에는 사진 위쪽에
 * 한 줄로 따로 서서 40px 을 차지했는데, 게시물 하나가 한 화면에 들어가야 한다는 조건
 * 아래에서 그 40px 은 곧 사진에서 빼는 높이였다. 릴스·인스타 피드가 쓰는 방식대로
 * 얹으면 사진이 그만큼 길어지면서 정보는 그대로 남는다.
 *
 * 얹은 글자가 사진에 묻히지 않게 위쪽에 검은 그라데이션을 깐다 — 카메라 화면이 상단
 * 컨트롤에 쓰는 것과 같은 수법이다(`CameraPage` 의 스크림). 점(`dotsInside`)이 흰 점 +
 * 그늘인 것과 같은 이유다.
 *
 * 사진은 한 장(`imageUrl`)일 수도, 옆으로 넘기는 여러 장(`photos`)일 수도 있다.
 * 넘기는 쪽은 점·`n/N` 알약이 따라붙는다.
 *
 * 좌우 여백을 안 갖는다 — 사진이 화면 끝까지 닿아야 해서 부모가 여백 없이 놓고,
 * 얹은 머리글과 캡션만 `px-3` 으로 안쪽에서 들여 쓴다.
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
    <article className="post-frame flex flex-col">
      <div className="post-photo relative">
        {isStrip ? (
          <PhotoStrip
            slides={photos}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange ?? (() => {})}
            className="h-full"
            frameClassName="h-full"
            dotsInside
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-cream-deep">
            <Photo
              src={imageUrl}
              className="absolute inset-0 h-full w-full object-cover"
              iconClassName="h-14 w-14"
            />
          </div>
        )}

        {/*
          얹은 머리글. 스크림은 `pointer-events-none` 이라 사진을 옆으로 넘기는 손짓을
          가로채지 않는다 — 머리글 줄 자체도 누를 것이 없어 같이 통과시킨다.
        */}
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
          <div className="relative flex items-center gap-2 px-3 pt-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-deep">
              <img src={TREE_AVATAR} alt="" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-white">
              {title}
            </span>
            {meta && <span className="shrink-0 text-[15px] text-white/85">{meta}</span>}
          </div>
        </div>
      </div>

      {(actions || caption) && (
        <div className="shrink-0 px-3 pt-2">
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
