import type { CSSProperties } from 'react';
import { useInView } from '@/shared/hooks/useInView';

/**
 * 사진 네 장의 자리와, 가운데(문서 카드)까지 옮겨갈 거리.
 *
 * 무대는 280×240 고정이다 — 320px 기기에서도 페이지 좌우 여백(`px-5`)을 빼면 280px 이
 * 남아 딱 들어간다. 좌표를 %로 두면 `translate` 의 % 기준이 자기 자신 크기라 거리가
 * 어긋나므로, 무대를 고정하고 px 로 적는다.
 */
const PHOTOS = [
  { left: 28, top: 10, tx: 86, ty: 120, delay: 0 },
  { left: 156, top: 2, tx: -42, ty: 128, delay: 0.12 },
  { left: 6, top: 70, tx: 108, ty: 60, delay: 0.24 },
  { left: 192, top: 58, tx: -78, ty: 72, delay: 0.36 },
];

/** 글줄의 최종 폭. 마지막 줄을 짧게 둬야 문단이 끝난 것으로 읽힌다. */
const LINES = [
  { w: '92%', delay: 3 },
  { w: '78%', delay: 3.28 },
  { w: '85%', delay: 3.56 },
  { w: '54%', delay: 3.84 },
];

/** 사진 한 장. 안의 그림은 풍경 한 컷을 최소한으로 줄인 것(해 + 능선). */
function PhotoTile({ tone }: { tone: 'a' | 'b' }) {
  return (
    <svg viewBox="0 0 52 52" className="h-[52px] w-[52px]" aria-hidden>
      <rect width="52" height="52" rx="11" fill={tone === 'a' ? '#C5D89D' : '#ECF6D8'} />
      <circle cx="36" cy="16" r="5" fill="#FFF6D1" />
      <path d="M4 42 L18 25 L29 37 L37 29 L48 42 Z" fill="#788F4A" opacity="0.85" />
    </svg>
  );
}

/**
 * 혜택 소개 — **사진이 모여 글이 되는** 연출.
 *
 * 참고한 유튜브 프리미엄이 혜택마다 짧은 애니메이션을 붙여 설명하는 자리다. 이 앱에서
 * 그 자리에 놓을 게 AI 블로그다 — 저장 용량이나 광고 제거와 달리 "무슨 일이 일어나는지"
 * 를 글로 설명하면 길고, 그림으로 보여주면 한 번에 통한다.
 *
 * 연출은 `styles.css` 의 `benefit-*` 키프레임이다(애니메이션 정의를 한곳에 모으는 이
 * 저장소 관행 — `SproutIllustration` 과 같다). 라이브러리를 들이지 않았다: 번들이 이미
 * 860KB 라 경고가 떠 있고, 이 정도 연출에 런타임은 필요 없다.
 *
 * **화면에 들어왔을 때 재생한다.** 페이지 한참 아래라 마운트 시점에 틀면 사용자가
 * 내려왔을 땐 이미 끝나 있다. 나갔다 들어오면 다시 튼다 — 한 번 놓치면 볼 방법이
 * 없어지는 것보다 낫다.
 *
 * 문구는 실제 동작에 근거한다(`profile/constants/faq.ts` 의 AI 블로그 항목과 같은 근거):
 * 기간을 고르면 그 기간의 기록으로 초안을 만들고, 넣을 기록과 말투를 고를 수 있다.
 */
export function BenefitShowcase() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.3 });

  return (
    <section ref={ref} className={inView ? 'benefit-play' : undefined}>
      <div
        className="relative mx-auto h-[240px] w-full max-w-[280px]"
        role="img"
        aria-label="흩어져 있던 사진들이 한데 모여 한 편의 글이 되는 모습"
      >
        {PHOTOS.map((photo, i) => (
          <div
            key={photo.left}
            className="benefit-photo absolute"
            style={
              {
                left: photo.left,
                top: photo.top,
                '--tx': `${photo.tx}px`,
                '--ty': `${photo.ty}px`,
                '--d': `${photo.delay}s`,
              } as CSSProperties
            }
          >
            <PhotoTile tone={i % 2 === 0 ? 'a' : 'b'} />
          </div>
        ))}

        {/* 사진들이 빨려드는 그 자리에 올라온다. */}
        <div className="benefit-doc absolute left-1/2 top-[100px] w-[200px] -translate-x-1/2 rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pictree-500" />
            <span className="text-[13px] font-medium text-[#5B6B38]">여행기 초안</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {LINES.map((line) => (
              <span
                key={line.delay}
                className="benefit-line block h-[7px] rounded-full bg-[#ECF6D8]"
                style={{ '--w': line.w, '--d': `${line.delay}s` } as CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>

      <h2 className="mt-2 text-center text-[19px] font-medium text-[#2C3930]">
        사진을 모으면, 여행기가 돼요
      </h2>
      <p className="mx-auto mt-2 max-w-[300px] text-center text-[15px] leading-relaxed text-[#60655C]">
        기간만 고르면 그동안의 기록으로 초안을 만들어 드려요. 넣을 기록과 말투는 직접 고를 수
        있어요.
      </p>
    </section>
  );
}
