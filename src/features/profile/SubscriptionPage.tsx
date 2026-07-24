import { useState } from "react";
import crownIcon from "./assets/icons/crown.svg";
import gisRouteIcon from "./assets/icons/gisRoute.svg";
import menuBookIcon from "./assets/icons/menuBook.svg";
import adsOffIcon from "./assets/icons/adsoff.svg";
import checkIcon from "./assets/icons/check.svg";
import cardIcon from "./assets/icons/card.svg";
import alertIcon from "./assets/icons/alert.svg";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";

interface BenefitRowProps {
  icon: string;
  title: string;
  subtitle: string;
}

function BenefitRow({ icon, title, subtitle }: BenefitRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <img src={icon} alt="" className="h-6 w-6 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        <p className="text-xs font-medium text-[#90908F]">{subtitle}</p>
      </div>
      <img src={checkIcon} alt="적용됨" className="h-6 w-6 flex-shrink-0" />
    </div>
  );
}

export function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="relative flex min-h-full flex-col bg-[#FFFDF7] pb-28">
      {/* 헤더 밴드 + 플랜 박스 */}
      <header className="bg-[#C5D89D] px-5 pb-10 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-xl font-bold text-black">구독 관리</h1>
        </div>

        {/* 현재 플랜 박스 */}
        <div className="mx-auto mt-5 w-[270px] rounded-[20px] bg-[#F6F0D7] px-5 py-4 shadow-[4px_4px_8px_0px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-3">
            <img src={crownIcon} alt="" className="h-10 w-10 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-medium text-[#111]">현재 플랜</p>
              <p className="text-base font-bold text-black">월간 프리미엄</p>
            </div>
          </div>

          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-md border border-[#E3F0C7] bg-[#FFFDF7] px-3 py-1 text-center">
              <p className="text-[8px] font-medium text-[#2C3930]">결제금액</p>
              <p className="text-[10px] font-bold text-[#2C3930]">4900원 / 월</p>
            </div>
            <div className="flex-1 rounded-md border border-[#E3F0C7] bg-[#FFFDF7] px-3 py-1">
              <p className="text-[8px] font-medium text-[#2C3930]">남은기간</p>
              <p className="text-[10px] font-bold text-[#2C3930]">30일</p>
            </div>
          </div>

          <p className="mt-2.5 text-center text-[8px] text-[#898888]">
            구독 시작일 : 2026년 3월 30일 - 만료일 2026년 4월 29일
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-5">
        {/* 이용중인 혜택 */}
        <section>
          <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
            이용중인 혜택
          </h2>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
            <BenefitRow icon={gisRouteIcon} title="동선 무제한 저장" subtitle="무제한" />
            <BenefitRow icon={menuBookIcon} title="AI 블로그 자동 생성" subtitle="무제한" />
            <BenefitRow icon={adsOffIcon} title="광고 제거" subtitle="광고 없음" />
          </div>
        </section>

        {/* 결제 정보 */}
        <section>
          <div className="mb-2 flex items-end justify-between pl-1">
            <h2 className="text-[15px] font-semibold text-[#9CAB84]">결제 정보</h2>
            <p className="text-[10px] text-[#2C3930]">
              다음 결제일 : 2026년 4월 29일
            </p>
          </div>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <img src={cardIcon} alt="" className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold text-[#111]">신용카드</p>
                <p className="text-xs font-medium text-[#90908F]">
                  **** **** **** 1234
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 구독 취소 버튼 */}
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="mt-1 h-10 rounded-xl bg-[#FFD5D5] text-lg font-semibold text-[#FF4B4B]"
        >
          구독 취소
        </button>
      </div>

      {cancelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
          onClick={() => setCancelOpen(false)}
        >
          <div
            className="w-full max-w-[352px] rounded-[20px] bg-[#FFFCEF] px-6 py-8"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={alertIcon} alt="" className="mx-auto h-[50px] w-[50px]" />

            <p className="mt-3 text-center text-xl font-bold text-black">
              정말 구독을 취소할까요?
            </p>
            <p className="mt-1 text-center text-xs text-[#2C3930]">
              구독을 취소하면 다음 혜택을 잃게 됩니다
            </p>

            <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border-2 border-[#C5D89D] bg-white py-4 text-center text-sm font-semibold text-[#111]">
              <p>동선 무제한 저장</p>
              <p>AI 블로그 자동 생성</p>
              <p>광고 제거</p>
            </div>

            <div className="mt-5 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="h-[38px] w-[120px] rounded-xl bg-[#ECECEC] text-base font-semibold text-[#2C3930]"
              >
                구독 유지
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="h-[38px] w-[120px] rounded-xl bg-[#FF5858] text-base font-semibold text-white"
              >
                구독 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
