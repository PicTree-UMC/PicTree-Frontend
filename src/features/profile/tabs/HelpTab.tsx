import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chip, SettingsList, SettingsRow } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { FAQ_CATEGORIES } from "../constants/faq";
import { SUPPORT_EMAIL } from "../constants/contact";

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
 * 마이페이지 ④ 질문 탭 — 도움말 / FAQ + 개인정보 처리방침.
 *
 * 카테고리를 칩으로 나눈다 — 한 화면에 다 펼치면 스무 개 가까운 질문이 이어져 원하는
 * 걸 찾기 어렵다. 칩을 누르면 그 주제의 질문만 남고, 질문은 아코디언이라 기본은 접혀 있다.
 *
 * ⚠️ **칩 줄은 탭 줄 바로 아래에 온다 — 한 화면에 가로 선택기가 둘이다.** 그래서 톤을
 * `ghost` 로 낮췄던 옛 설정을 그대로 둔다(칩이 탭보다 눈에 먼저 걸리면 어느 쪽이 화면을
 * 가르는지 헷갈린다). 위 탭은 페이지를 갈고 이 칩은 아래 목록만 간다.
 *
 * **개인정보 처리방침은 줄 하나로 남기고 제 페이지로 보낸다.** 법률 문서라 접었다 폈다
 * 하는 아코디언에 넣으면 이 탭이 끝없이 길어지고, FAQ 를 찾으러 온 사람이 스크롤로
 * 그걸 통과해야 한다. 짧게 요약할 수 있는 종류의 글도 아니다.
 */
export function HelpTab() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const category = FAQ_CATEGORIES[activeCategory];

  return (
    <div className="pt-5">
      {/* 다섯 개라 390px 안에 다 안 들어가서 가로 스크롤로 둔다. */}
      <div
        role="tablist"
        aria-label="도움말 주제"
        className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FAQ_CATEGORIES.map((item, index) => {
          const isActive = index === activeCategory;
          return (
            <Chip
              key={item.label}
              tone="ghost"
              size="sm"
              selected={isActive}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveCategory(index);
                // 주제를 바꾸면 펼쳐 둔 질문은 접는다 — 다른 주제의 잔상이 남지 않게.
                setOpenQuestion(null);
              }}
            >
              {item.label}
            </Chip>
          );
        })}
      </div>

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
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#60655C]">{item.a}</p>
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

        <SettingsList className="mt-3">
          <SettingsRow
            title="개인정보 처리방침"
            onClick={() => navigate(ROUTES.privacy)}
          />
        </SettingsList>
      </div>
    </div>
  );
}
