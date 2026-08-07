/**
 * 페이지 맨 위 유도 문구.
 *
 * 한때 위에 로고 락업(앱 아이콘 + `PicTree Premium` 한 줄)이 있었으나 뺐다 — 지금은
 * 헤드라인 하나뿐이다. 되살릴 거라면 아이콘은 `public/apple-touch-icon.jpg`(앱 아이콘)
 * 를 쓴다: 런처·홈 화면에서 이미 그 그림으로 이 앱을 아는 사람이 보는 화면이고,
 * 디자인 규칙의 GREEN-500·700 도 그 파일에서 뽑은 값이라 배경 그라데이션과 같은 계열로
 * 앉는다.
 *
 * 헤드라인은 이 페이지에서 제일 큰 글자다. **굵기는 medium** — 한때 `font-bold` 로
 * 뒀다가 되돌렸다. §2 의 '볼드 금지' 를 지키는 쪽이고, 크기(27px)만으로도 위계는 선다.
 */
export function PremiumHero() {
  return (
    <header className="flex flex-col items-center px-5 pt-header text-center">
      <h1 className="mt-7 text-[27px] font-medium leading-[1.35] tracking-[-0.01em] text-[#2C3930]">
        나만의 순간과 기록을
        <br />
        제한없이 남겨보세요
      </h1>
    </header>
  );
}
