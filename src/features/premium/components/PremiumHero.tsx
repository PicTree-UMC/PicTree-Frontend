import { PicTreeMark } from '@/shared/components';

/**
 * 페이지 맨 위 로고 락업 + 유도 문구.
 *
 * 로고 아래에 `PICTREE PREMIUM` 을 얹는 세로 락업이다. 유튜브 프리미엄이 서비스 로고와
 * 등급 이름을 한 덩어리로 보여주는 방식을 따랐다 — 등급 이름만 크게 쓰면 무엇의 프리미엄인지
 * 가 사라진다.
 *
 * `PREMIUM` 은 자간을 벌린 라틴 대문자다. 한글이 없는 줄이라 KOROAD 의 라틴 폼이 그대로
 * 나오고, 자간이 붙으면 로고 옆에서 단어가 아니라 덩어리로 읽힌다.
 */
export function PremiumHero() {
  return (
    <header className="flex flex-col items-center px-5 pt-header text-center">
      {/* 로고 원본은 100×119px 이라 히어로에 그대로 쓰면 문구보다 무겁다. 72px 로 줄인다. */}
      <PicTreeMark className="h-[86px] w-[72px] object-contain" />

      <h1 className="mt-3 text-[22px] tracking-[0.18em] text-[#2C3930]">PICTREE</h1>
      <p className="mt-0.5 text-[15px] tracking-[0.32em] text-[#5B6B38]">PREMIUM</p>

      {/*
        유도 문구. 제목과 붙여 두면 로고 락업의 일부로 읽혀서 한 칸 띄운다.
        본문 크기(15px)를 유지한다 — 여기만 키우면 아래 플랜 카드의 값들보다 목소리가 커진다.
      */}
      <p className="mt-6 text-[15px] leading-relaxed text-[#2C3930]">
        더 많은 기록들을 제한없이 남겨보세요
      </p>
    </header>
  );
}
