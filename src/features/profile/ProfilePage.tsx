import { useState } from 'react';

import treeIcon from './assets/icons/tree.svg';
import cardIcon from './assets/icons/card.svg';
import statsIcon from './assets/icons/stats.svg';
import starIcon from './assets/icons/star.svg';
import logoutIcon from './assets/icons/logout.svg';
import chevronIcon from './assets/icons/chevron.svg';


type MenuRowProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
};

function MenuRow({ icon, title, subtitle, onClick }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <img src={icon} alt="" className="h-6 w-6 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#292929]">{title}</p>
        {subtitle && <p className="text-[12px] text-[#6e6e6e]">{subtitle}</p>}
      </div>
      <img src={chevronIcon} alt="" className="h-[22px] w-[23px] flex-shrink-0" />
    </button>
  );
}

export function ProfilePage() {
  const [alarmOn, setAlarmOn] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7fb] pb-24">
      {/* 헤더 밴드 */}
      <header className="bg-[#bad0c1] px-6 pb-8 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d9d9d9]">
            <img src={treeIcon} alt="" className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-semibold text-black">밴드맨</p>
            <p className="text-sm text-black/80">oasis@gmail.com</p>
            <span className="mt-1 inline-block rounded-[10px] bg-[#ffcf76] px-2 py-0.5 text-[10px] text-black">
              월간 프리미엄
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4 pt-4">
        {/* 근처 나무 알림 */}
        <div className="flex items-center justify-between rounded-[18px] border border-[#8bcc6a] bg-white px-4 py-3">
          <div>
            <p className="text-[15px] font-bold text-[#292929]">근처 나무 알림</p>
            <p className="text-[12px] text-[#6e6e6e]">꺼짐 · 홈에서 바로 다시 켤 수 있어요</p>
          </div>
          <button
            type="button"
            onClick={() => setAlarmOn((v) => !v)}
            aria-pressed={alarmOn}
            className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
              alarmOn ? 'bg-[#8bcc6a]' : 'bg-[#cccccc]'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                alarmOn ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* 계정 */}
        <section>
          <p className="mb-1 px-1 text-[15px] text-[#8f8e8e]">계정</p>
          <div className="divide-y divide-[#eeeeee] overflow-hidden rounded-[18px] border border-[#8bcc6a] bg-white">
            <MenuRow icon={cardIcon} title="구독 및 결제" subtitle="월간 프리미엄 - 이용중" />
            <MenuRow icon={statsIcon} title="여행 캘린더" subtitle="잔디로 보는 나의 여행 기록" />
            <MenuRow icon={starIcon} title="즐겨찾기 장소" subtitle="다시 방문하고 싶은 장소 관리" />
          </div>
        </section>

        {/* 정보 */}
        <section>
          <p className="mb-1 px-1 text-[15px] text-[#8f8e8e]">정보</p>
          <div className="divide-y divide-[#eeeeee] overflow-hidden rounded-[18px] border border-[#8bcc6a] bg-white">
            <MenuRow icon={cardIcon} title="개인정보 처리방침" />
            <MenuRow icon={statsIcon} title="도움말 / FAQ" />
          </div>
        </section>

        {/* 로그아웃 */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 py-2 text-[15px] text-[#ff4b4b]"
        >
          <img src={logoutIcon} alt="" className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </div>
  );
}
