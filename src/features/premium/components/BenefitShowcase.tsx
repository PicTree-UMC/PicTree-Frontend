import type { CSSProperties } from 'react';
import { useInView } from '@/shared/hooks/useInView';

/**
 * 사진 네 장의 자리와, 무대 정중앙(문서 카드)까지 옮겨갈 거리.
 *
 * 무대는 280×240 고정이다 — 320px 기기에서도 페이지 좌우 여백(`px-5`)을 빼면 280px 이
 * 남아 딱 들어간다. 좌표를 %로 두면 `translate` 의 % 기준이 자기 자신 크기라 거리가
 * 어긋나므로, 무대를 고정하고 px 로 적는다.
 *
 * **네 귀퉁이에 하나씩 둔다.** 한때 넷 다 위쪽에 몰려 있었는데, 그러면 카드가 아래에서
 * 올라오는 꼴이라 위아래 여백이 갈리고 화면이 한쪽으로 쏠린다. 가운데를 둘러싸게 놓으면
 * '모인다'도 더 잘 읽히고 무대도 고르게 찬다.
 *
 * tx/ty 는 각 사진의 **중심**에서 무대 중심(140, 120)까지의 거리다. 사진은 52px 이라
 * 중심 = left + 26, top + 26.
 */
const PHOTOS = [
  { left: 24, top: 18, tx: 90, ty: 76, delay: 0 },
  { left: 196, top: 8, tx: -82, ty: 86, delay: 0.12 },
  { left: 10, top: 148, tx: 104, ty: -54, delay: 0.24 },
  { left: 204, top: 158, tx: -90, ty: -64, delay: 0.36 },
];

/** 글줄의 최종 폭. 마지막 줄을 짧게 둬야 문단이 끝난 것으로 읽힌다. */
const LINES = [
  { w: '92%', delay: 3 },
  { w: '78%', delay: 3.28 },
  { w: '85%', delay: 3.56 },
  { w: '54%', delay: 3.84 },
];

/*
  freeLimitSentence('무료 플랜은 한 달에 한 편이에요' 를 `freePlan` 에서 파생하던 함수)는
  지웠다 — 아래 문구가 무료 한도를 언급하지 않는 쪽으로 다시 쓰이면서 쓰는 곳이 없어졌다.
  그래서 `freePlan` prop 도 함께 뺐다.

  ⚠️ 무료 한도를 다시 문구에 넣을 거라면 그 함수를 되살릴 것(git 이력에 있다). **숫자를
  직접 박으면 안 된다** — 서버가 정하는 값이라 바뀌는 순간 문구가 거짓이 된다
  (`lib/planDisplay.ts` 의 "되돌리지 말 것" 과 같은 이유).
*/

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
 * ⚠️ **파는 건 기능이 아니라 한도다.** AI 블로그 자체는 무료 플랜에도 있다(월 1회).
 * 그래서 문구가 "사진을 모으면 여행기가 돼요" 라고만 하면 **돈을 안 내도 되는 것을
 * 자랑하는 꼴**이 된다 — 처음에 그렇게 썼다가 고쳤다. 그림은 기능을 보여주고, 글은
 * 무료와 유료의 차이를 말한다.
 *
 * 연출은 `styles.css` 의 `benefit-*` 키프레임이다(애니메이션 정의를 한곳에 모으는 이
 * 저장소 관행 — `SproutIllustration` 과 같다). 라이브러리를 들이지 않았다: 번들이 이미
 * 860KB 라 경고가 떠 있고, 이 정도 연출에 런타임은 필요 없다.
 *
 * **화면에 들어왔을 때 재생한다.** 페이지 한참 아래라 마운트 시점에 틀면 사용자가
 * 내려왔을 땐 이미 끝나 있다. 나갔다 들어오면 다시 튼다 — 한 번 놓치면 볼 방법이
 * 없어지는 것보다 낫다.
 *
 * 문구에는 요금제 값이 하나도 안 들어간다 — 서버 값을 쓸 일이 생기면 `freePlan` 을 다시
 * 받아 파생시킬 것(위 `freeLimitSentence` 주석 참고). 숫자를 직접 박지 않는다.
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

        {/*
          사진들이 빨려드는 자리 — 무대 정중앙이다.

          ⚠️ **가운데 정렬을 `transform`(`-translate-x-1/2` 등)으로 하면 안 된다.** 아래
          `benefit-doc` 키프레임이 `transform`(translateY·scale)을 쓰기 때문에 정렬 보정이
          통째로 덮어써진다 — 실제로 카드 왼쪽 끝이 무대 50% 에 놓여 오른쪽이 잘렸다.
          그래서 **바깥 줄이 flex 로 두 축을 다 잡고**, 카드의 transform 은 연출만 쓴다.

          `top` 을 px 로 박지 않는 이유도 있다: 세로 가운데를 손으로 맞추려면 카드의 실제
          높이를 알아야 하는데(글줄 수·글꼴에 따라 달라진다) `items-center` 는 높이가
          바뀌어도 알아서 맞춘다. 한때 `top-[100px]` 이었고 그 값이 카드를 아래로 밀어
          위 여백 100px · 아래 27px 로 갈라 놨다.
        */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="benefit-doc w-[200px] rounded-2xl border border-line-soft bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pictree-500" />
              <span className="text-[13px] font-medium text-pictree-700">여행기 초안</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {LINES.map((line) => (
                <span
                  key={line.delay}
                  className="benefit-line block h-[7px] rounded-full bg-pictree-100"
                  style={{ '--w': line.w, '--d': `${line.delay}s` } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-center text-[21px] font-medium text-ink">
        흩어져있던 여정의 파편들을
        <br/>
        하나의 이야기로 만드세요
      </h2>
      <p className="mx-auto mt-2 max-w-[300px] text-center text-[18px] leading-relaxed text-ink-muted">
        플랜을 성장시키고 더 많은 저장 공간과 PICTREE 토큰을 누려보세요
      </p>
    </section>
  );
}
