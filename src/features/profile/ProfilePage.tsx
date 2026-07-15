import { useState } from "react";
import treeIcon from "./assets/icons/tree.svg";
import cardIcon from "./assets/icons/card.svg";
import statsIcon from "./assets/icons/stats.svg";
import starIcon from "./assets/icons/star.svg";
import logoutIcon from "./assets/icons/logout.svg";
import chevronIcon from "./assets/icons/chevron.svg";

interface MenuRowProps {
  icon: string; // 왼쪽 아이콘 (없으면 빈 문자열)
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

function MenuRow({ icon, title, subtitle, onClick }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      {icon && <img src={icon} alt="" className="h-6 w-6 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-[#111]">{title}</p>
        {subtitle && (
          <p className="text-xs font-medium text-[#90908F]">{subtitle}</p>
        )}
      </div>
      <img src={chevronIcon} alt="" className="h-[20px] w-[23px] flex-shrink-0" />
    </button>
  );
}

export function ProfilePage() {
  // 근처 나무 알림 토글 (기본 꺼짐)
  const [alarmOn, setAlarmOn] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF7] pb-28">
      {/* 헤더 밴드 */}
      <header className="bg-[#C5D89D] px-[31px] pb-8 pt-6">
        <div className="flex items-center gap-5">
          {/* 아바타 */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[#F6F0D7]">
            <img src={treeIcon} alt="" className="h-9 w-9" />
          </div>

          <div>
            <p className="text-xl font-bold text-black">밴드맨</p>
            <p className="mt-0.5 text-base font-medium text-black">
              oasis@gmail.com
            </p>
            <span className="mt-1.5 inline-block rounded-xl bg-[#DDBF68] px-3 py-0.5 text-[10px] font-medium text-[#2C3930]">
              월간 프리미엄
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-6">
        {/* 근처 나무 알림 카드 */}
        <div className="flex items-center justify-between rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-[#111]">근처 나무 알림</p>
            <p className="mt-0.5 text-xs font-medium text-[#90908F]">
              {alarmOn ? "켜짐" : "꺼짐"} · 홈에서 바로 켤 수 있어요
            </p>
          </div>
          {/* 토글 */}
          <button
            type="button"
            role="switch"
            aria-checked={alarmOn}
            aria-label="근처 나무 알림"
            onClick={() => setAlarmOn((prev) => !prev)}
            className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
              alarmOn ? "bg-[#9CAB84]" : "bg-[#CCC]"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${
                alarmOn ? "left-[19px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {/* 계정 섹션 */}
        <section>
          <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
            계정
          </h2>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
            <MenuRow
              icon={cardIcon}
              title="구독 및 결제"
              subtitle="월간 프리미엄 · 이용중"
            />
            <MenuRow
              icon={statsIcon}
              title="여행 캘린더"
              subtitle="잔디로 보는 나의 여행기록"
            />
            <MenuRow
              icon={starIcon}
              title="즐겨찾기 장소"
              subtitle="다시 방문하고 싶은 장소 관리"
            />
          </div>
        </section>

        {/* 정보 섹션 */}
        <section>
          <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
            정보
          </h2>
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-6 py-2">
            <MenuRow icon="" title="개인정보 처리방침" />
            <MenuRow icon="" title="도움말 / FAQ" />
          </div>
        </section>

        {/* 로그아웃 */}
        <button
          type="button"
          className="mt-1 flex items-center justify-center gap-2 py-2"
        >
          <img src={logoutIcon} alt="" className="h-6 w-6" />
          <span className="text-base text-[#FF4B4B]">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
