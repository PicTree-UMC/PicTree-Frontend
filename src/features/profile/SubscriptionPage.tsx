import { useState } from 'react';

import crownIcon from './assets/icons/crown.svg';
import bookIcon from './assets/icons/book.svg';
import backupIcon from './assets/icons/backup.svg';
import adsoffIcon from './assets/icons/adsoff.svg';
import calendarIcon from './assets/icons/calendar.svg';
import checkIcon from './assets/icons/check.svg';
import warningIcon from './assets/icons/warning.svg';
import xmarkIcon from './assets/icons/xmark.svg';


const LOST_BENEFITS = ['용량 업그레이드', 'AI 블로그 자동 생성', '광고 제거'];

function BenefitRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#8bcc6a] bg-white px-4 py-3">
      <img src={icon} alt="" className="h-8 w-8 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-black">{title}</p>
        <p className="text-[10px] text-black">{sub}</p>
      </div>
      <img src={checkIcon} alt="" className="h-6 w-6 flex-shrink-0" />
    </div>
  );
}

export function SubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#f7f7fb] pb-24">
      {/* 헤더 밴드 + 현재 플랜 카드 */}
      <header className="bg-[#bad0c1] px-5 pb-6 pt-6">
        <h1 className="mb-4 text-[16px] text-black">구독 관리</h1>

        <div className="mx-auto w-[268px] rounded-[16px] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#d9d9d9]">
              <img src={crownIcon} alt="" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-black">현재 플랜</p>
              <p className="text-[16px] font-semibold text-black">월간 프리미엄</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1 rounded bg-[#d9d9d9] px-2 py-1.5">
              <p className="text-[10px] text-black">결제 금액</p>
              <p className="text-[10px] text-black">4900원/월</p>
            </div>
            <div className="flex-1 rounded bg-[#d9d9d9] px-2 py-1.5">
              <p className="text-[10px] text-black">남은 기간</p>
              <p className="text-[10px] text-black">30일</p>
            </div>
          </div>

          <p className="mt-2 text-[9px] text-[#898888]">
            구독 시작일: 2026년 3월 30일 - 만료일: 2026년 04월 29일
          </p>
        </div>
      </header>

      <div className="space-y-5 px-5 pt-5">
        {/* 이용 중인 혜택 */}
        <section>
          <h2 className="mb-2 text-[16px] text-black">이용 중인 혜택</h2>
          <div className="space-y-3">
            <BenefitRow icon={backupIcon} title="용량 업그레이드" sub="5GB" />
            <BenefitRow icon={bookIcon} title="AI 블로그 자동 생성" sub="월 20회" />
            <BenefitRow icon={adsoffIcon} title="광고 제거" sub="광고 없음" />
          </div>
        </section>

        {/* 결제 정보 */}
        <section>
          <h2 className="mb-2 text-[16px] text-black">결제 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[16px] border border-[#8bcc6a] bg-white px-4 py-3">
              <img src={bookIcon} alt="" className="h-8 w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-black">신용카드</p>
                <p className="text-[10px] text-black">**** **** **** 1234</p>
              </div>
              <span className="flex-shrink-0 rounded-[10px] bg-[#ffcf76] px-3 py-0.5 text-[10px] text-black">
                변경
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-[16px] border border-[#8bcc6a] bg-white px-4 py-3">
              <img src={calendarIcon} alt="" className="h-8 w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-black">다음 결제일</p>
                <p className="text-[10px] text-black">2026년 4월 30일</p>
              </div>
            </div>
          </div>
        </section>

        {/* 구독 취소 */}
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="w-full rounded-[8px] bg-[#f5b8b8] py-2.5 text-center text-[15px] text-[#ff3737]"
        >
          구독 취소
        </button>
      </div>

      {cancelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setCancelOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-t-[24px] bg-white px-8 pb-8 pt-5 shadow-[0px_-8px_8px_0px_rgba(0,0,0,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d9d9d9]">
              <img src={warningIcon} alt="" className="h-12 w-12" />
            </div>

            <p className="mt-3 text-center text-[20px] text-black">정말 구독을 취소할까요?</p>
            <p className="mt-2 text-center text-[16px] text-black">
              구독을 취소하면 다음 혜택을 잃게 됩니다:
            </p>

            <div className="mt-4 space-y-2 rounded-[10px] bg-[#d9d9d9] px-4 py-4">
              {LOST_BENEFITS.map((title) => (
                <div key={title} className="flex items-center justify-center gap-2 text-[12px] text-black">
                  <img src={xmarkIcon} alt="" className="h-5 w-5" />
                  {title}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="flex-1 rounded-[10px] bg-[#d9d9d9] py-3 text-[12px] text-black"
              >
                구독 유지
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="flex-1 rounded-[10px] bg-[#d9d9d9] py-3 text-[12px] text-black"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
