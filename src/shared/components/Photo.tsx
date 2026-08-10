import { useState, type CSSProperties, type ReactNode } from 'react';

/** 사진이 없거나 못 불러왔을 때 대신 세우는 나무 — 지도 마커와 같은 에셋. */
const FALLBACK_ICON = '/markers/tree.svg';

/**
 * `<img src>` 에 넣어도 되는 값인지 본다.
 *
 * ⚠️ 서버의 `defaultImage` 는 `"DEFAULT_1"` 같은 **식별자**(`VarChar(20)`)라 URL 이 아니다.
 * 그대로 넘기면 상대경로 이미지 요청이 나가 404 → 깨진 이미지가 된다(#209 에서 블로그
 * 로드맵이 실제로 그 요청을 보내고 있었다). 부르는 쪽에서 거르는 건 한 번 데여도 또
 * 새므로 — 타임라인은 주석까지 달아 두고도 블로그에서 다시 샜다 — 여기서 막는다.
 *
 * 이 앱이 그리는 사진은 presigned URL(`https://…`) 아니면 `public/` 의 루트 상대경로
 * (`/markers/…`) 둘뿐이라, 그 둘만 통과시키면 식별자는 전부 걸린다.
 */
const isImageSrc = (src: string) => /^(?:https?:|data:|blob:|\/)/.test(src);

interface PhotoProps {
  /** 사진 URL. 없거나 URL 이 아니거나 로드에 실패하면 폴백으로 떨어진다. */
  src?: string | null;
  /** 사진 설명. 빈 문자열이면 폴백도 낭독기에서 감춘다(장식으로 본다). */
  alt?: string;
  /**
   * 사진과 폴백 상자 **양쪽에 똑같이** 걸린다. 크기·라운드·`object-cover` 처럼
   * 자리의 모양을 정하는 것은 전부 여기로 준다 — 그래야 폴백으로 떨어져도 칸이 안 흔들린다.
   */
  className?: string;
  /** 폴백 나무 아이콘의 크기. 상자가 화면마다 달라 부르는 쪽이 정한다. */
  iconClassName?: string;
  /**
   * 나무 대신 세울 것. **폴백이 나무여선 안 되는 자리**를 위한 슬롯이다 — 즐겨찾기
   * 격자는 장소명이어야 하고(나무만 여러 개 뜨면 어디였는지 못 읽는다), 블로그 본문은
   * 사진이 없으면 문단만 두는 게 글로서 맞다.
   *
   * ⚠️ **`undefined` 와 `null` 의 뜻이 다르다.** `ReactNode` 가 둘 다 포함하지만
   * 여기서는 갈라 읽는다 — **생략하면 기본 나무, `null` 이면 아무것도 안 그린다.**
   *
   * 주면 `className`·`iconClassName`·`message` 는 폴백에 안 걸린다. 넘긴 노드가
   * 크기·모양을 스스로 갖는다(사진일 때의 칸과 어긋나지 않게 하는 건 부르는 쪽 몫).
   */
  fallback?: ReactNode;
  /**
   * 로드 실패 시 아이콘과 함께 보일 문구. 사진이 콘텐츠 전부인 자리(스토리 뷰어처럼
   * 전체화면)에서 쓴다 — 거기서 아이콘만 두면 **사진 없이 저장한 기록과 구별이 안 된다.**
   *
   * `src` 가 아예 없을 때는 뜨지 않는다. 그건 못 불러온 게 아니라 처음부터 없는 것이다.
   */
  message?: string;
  messageClassName?: string;
  /**
   * ⚠️ **기본이 `lazy` 다.** 이 앱의 사진은 대부분 목록·격자·피드에 있어서 첫 화면에
   * 안 보이는 것이 훨씬 많다. 종전에는 기본값이 없어 두 곳만 `lazy` 를 넘기고 나머지는
   * 전부 즉시 받았다.
   *
   * **사진이 그 화면의 전부인 자리만 `eager` 로 연다** — 열자마자 봐야 하는 것을
   * 게으르게 두면 빈 칸을 먼저 보게 된다(스토리 뷰어가 그 자리다).
   */
  loading?: 'lazy' | 'eager';
  style?: CSSProperties;
}

/**
 * 사진 한 장. **없는 사진과 못 불러온 사진을 같은 폴백으로 흡수한다.**
 *
 * 예전에는 화면마다 `url ? <img> : <대체>` 를 따로 적었고 `onError` 는 어디에도 없어서,
 * presigned URL 이 만료되면 브라우저 기본 깨진 아이콘과 `alt` 가 그대로 노출됐다(#209).
 * 대체 이미지도 앱 아이콘·나무 마커·사진 플레이스홀더로 화면마다 갈렸다 — **나무로 통일한다.**
 */
export function Photo({
  src,
  alt = '',
  className = '',
  iconClassName = 'h-6 w-6',
  fallback,
  message,
  messageClassName = 'text-[13px] text-ink-muted',
  loading = 'lazy',
  style,
}: PhotoProps) {
  // 실패한 사실이 아니라 **실패한 URL** 을 기억한다. 목록에서 컴포넌트가 재사용될 때
  // (같은 key 에 다른 사진) boolean 이면 앞 장의 실패가 남아 멀쩡한 사진까지 가린다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasSrc = !!src && isImageSrc(src);
  const loadFailed = hasSrc && src === failedSrc;

  if (hasSrc && !loadFailed) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        /*
          디코딩을 메인 스레드 밖으로 뺀다. 큰 사진이 여러 장 들어오는 격자·피드에서
          이게 없으면 디코딩이 렌더를 막아 스크롤이 걸린다. 값을 바꿀 이유가 있는
          자리가 없어서 prop 으로 열지 않았다.
        */
        decoding="async"
        style={style}
        className={className}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  // 슬롯이 주어졌으면 그쪽이 폴백 전부다. `undefined` 검사인 것이 중요하다 —
  // `null` 은 "아무것도 안 그린다" 는 뜻이라 여기를 통과해야 한다.
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <span
      style={style}
      // 아이콘만 있을 때도 같은 레이아웃이다 — 자식이 하나면 `flex-col`·`gap` 은 아무 일도 안 한다.
      className={`${className} flex flex-col items-center justify-center gap-3`}
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
    >
      <img src={FALLBACK_ICON} alt="" className={iconClassName} />
      {loadFailed && message && <span className={messageClassName}>{message}</span>}
    </span>
  );
}
