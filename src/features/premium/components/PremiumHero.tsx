/**
 * 페이지 맨 위 로고 락업 + 유도 문구.
 *
 * **락업은 한 줄이다** — 아이콘과 이름을 가로로 붙인다(참고: 유튜브 프리미엄). 세로로
 * 쌓으면 로고가 페이지의 주인공이 되는데, 이 화면의 주인공은 아래 유도 문구다. 한 줄로
 * 눕히면 락업은 '무엇의 프리미엄인지'만 말하고 자리를 비켜준다.
 *
 * 아이콘은 앱 아이콘(`public/apple-touch-icon.jpg`)을 그대로 쓴다. 런처·홈 화면에서 이미
 * 이 그림으로 이 앱을 아는 사람이 보는 화면이라 같은 그림이어야 알아본다. 디자인 규칙의
 * GREEN-500·700 도 이 파일에서 뽑은 값이라 배경 그라데이션과 같은 계열로 앉는다.
 *
 * `PicTree` 는 medium, `Premium` 은 light(300). 유튜브가 워드마크와 등급 이름의 굵기를
 * 나누는 방식이고, §2 가 허용하는 두 굵기 안에서 같은 위계가 나온다.
 */
export function PremiumHero() {
  return (
    <header className="flex flex-col items-center px-5 pt-header text-center">
      <div className="flex items-center gap-2.5">
        {/*
          JPG 라 배경이 구워져 있다(§8 경고와 같은 파일 종류) — 여기서는 문제가 안 된다.
          앱 아이콘은 원래 모서리까지 꽉 찬 정사각이고, iOS 홈 화면과 같게 모서리만 둥글린다.
        */}
        <img src="/apple-touch-icon.jpg" alt="" className="h-9 w-9 rounded-[9px]" />
        <p className="text-[21px] leading-none text-[#2C3930]">
          <span className="font-medium">PicTree</span>{' '}
          <span className="font-light">Premium</span>
        </p>
      </div>

      {/*
        유도 문구. 이 페이지에서 제일 큰 글자이자 유일한 볼드다.

        ⚠️ §2 는 본문에서 볼드를 금지하는데 여기는 그 예외다 — 파는 화면의 헤드라인이라
        한 번은 목소리를 높여야 하고, 27px 은 WCAG '대형 텍스트' 기준(18.7px 볼드)을 넘어
        §1.2 가 볼드를 안 쓰는 근거로 든 '전부 일반 텍스트' 에 해당하지 않는다.
        (KOROAD 는 Bold 700 face 를 실제로 싣는다 — 폴백이 아니다.)
        가이드라인 §2 에 이 예외를 적어 뒀다. 본문·버튼으로 번지지 않게 할 것.
      */}
      <h1 className="mt-7 text-[27px] font-bold leading-[1.35] tracking-[-0.01em] text-[#2C3930]">
        나만의 순간과 기록을
        <br />
        제한없이 남겨보세요
      </h1>
    </header>
  );
}
