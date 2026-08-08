import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FAQ_CATEGORIES } from "./constants/faq";
import { SUPPORT_EMAIL } from "./constants/contact";
import { Chip, NavBar } from "@/shared/components";

const ICON = {
  fill: "none",
  stroke: "#2C3930",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconQuestion() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] flex-shrink-0" {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.7.6-.7 1.1v.5M12 16.5h.01" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] flex-shrink-0" {...ICON}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      {...ICON}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * 도움말 / FAQ.
 *
 * 카테고리를 탭으로 나눈다 — 한 화면에 다 펼치면 스무 개 가까운 질문이 이어져
 * 원하는 걸 찾기 어렵다. 탭을 누르면 그 주제의 질문만 남는다.
 *
 * 질문은 아코디언이다. 기본은 모두 접혀 있어 제목만 훑어볼 수 있고, 궁금한
 * 것만 펼친다.
 */
export function HelpFaqPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const category = FAQ_CATEGORIES[activeTab];

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="px-5 pb-4 pt-header">
        <NavBar onBack={() => navigate(-1)} title="도움말 / FAQ" />

        {/*
          카테고리 탭. 다섯 개라 390px 안에 다 안 들어가서 가로 스크롤로 둔다.
          헤더 안에 두어 아래 목록만 바뀌는 게 눈에 보이게 했다.
        */}
        <div
          role="tablist"
          aria-label="도움말 주제"
          className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FAQ_CATEGORIES.map((item, index) => {
            const isActive = index === activeTab;
            return (
              <Chip
                key={item.label}
                tone="ghost"
                size="sm"
                selected={isActive}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(index);
                  // 탭을 바꾸면 펼쳐 둔 질문은 접는다 — 다른 주제의 잔상이 남지 않게.
                  setOpenQuestion(null);
                }}
              >
                {item.label}
              </Chip>
            );
          })}
        </div>
      </header>

      <div className="flex flex-col gap-3 px-5 pt-5">
        {category.items.map((item) => {
          const isOpen = openQuestion === item.q;

          return (
            <div
              key={item.q}
              className="rounded-xl border border-[#ECECEC] bg-white px-5 py-4"
            >
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2.5 text-left"
              >
                <IconQuestion />
                <h2 className="flex-1 text-[15px] font-medium text-[#2C3930]">{item.q}</h2>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#60655C]">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}

        {/* 문의처는 주제와 무관하게 늘 보인다 — 답을 못 찾았을 때 다음 행동이 필요하다. */}
        <div className="mt-2 rounded-xl border border-[#ECECEC] bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <IconMail />
            <h2 className="text-[15px] font-medium text-[#2C3930]">
              더 궁금한 점이 있나요?
            </h2>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-[#60655C]">
            {SUPPORT_EMAIL} 으로 보내주시면 확인 후 답변드릴게요.
          </p>
        </div>
      </div>
    </div>
  );
}
