import type { ReactNode } from "react";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";

const iconBase = "h-[22px] w-[22px] flex-shrink-0";
const stroke = {
  fill: "none",
  stroke: "#2C3930",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconPin = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h7" />
  </svg>
);
const IconDb = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10.5 20a2 2 0 0 0 3 0" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" className={iconBase} {...stroke}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </svg>
);

/* ---------- 콘텐츠 데이터 ---------- */
interface Field {
  label: string;
  value: string;
}
interface PolicyCard {
  icon: ReactNode;
  title: string;
  fields?: Field[];
  body?: string;
}
interface Section {
  label: string;
  cards: PolicyCard[];
}

const SECTIONS: Section[] = [
  {
    label: "처리하는 개인정보 항목",
    cards: [
      {
        icon: <IconPin />,
        title: "회원 식별 및 계정 관리",
        fields: [
          { label: "항목", value: "소셜 계정 식별자, 이메일, 닉네임, 프로필 사진" },
          { label: "목적", value: "로그인, 회원 식별, 계정 관리, 동의 이력 관리" },
          { label: "기간", value: "회원 탈퇴 시까지" },
        ],
      },
      {
        icon: <IconPin />,
        title: "장소 기록 서비스",
        fields: [
          { label: "항목", value: "장소명, 기록 날짜, 한 줄 코멘트, 사진, 이모지, 기록 생성 시각" },
          { label: "목적", value: "장소 기록 저장, 타임라인 표시, 지도 마커 표시" },
          { label: "기간", value: "기록 삭제 또는 회원 탈퇴 시까지" },
        ],
      },
      {
        icon: <IconPin />,
        title: "위치기반 기능",
        fields: [
          { label: "항목", value: "현재 위치, 촬영 위치, 사진 EXIF 위치, 저장 장소의 위도·경도" },
          { label: "목적", value: "지도 기록, 동선 표시, 근처 장소 알림, 위치 보정" },
          { label: "기간", value: "기록 삭제 또는 회원 탈퇴 시까지" },
        ],
      },
      {
        icon: <IconDoc />,
        title: "AI 블로그 및 저장 동선",
        fields: [
          { label: "항목", value: "선택한 날짜 범위, 장소 기록, 저장 동선, AI 블로그 초안" },
          { label: "목적", value: "여행 블로그 초안 생성, 초안 저장, 동선 관리" },
          { label: "기간", value: "초안/동선 삭제 또는 회원 탈퇴 시까지" },
        ],
      },
      {
        icon: <IconDb />,
        title: "요금제 및 결제 관리",
        fields: [
          { label: "항목", value: "구독 플랜, 결제 상태, 결제 시작일, 다음 결제일" },
          { label: "목적", value: "프리미엄 기능 제공, 구독 상태 표시, 결제 내역 관리" },
          { label: "기간", value: "회원 탈퇴 시까지. 결제 증빙 등 법령상 보존 정보는 해당 기간 동안 별도 보관" },
        ],
      },
      {
        icon: <IconPerson />,
        title: "개인정보 수집 원칙",
        body:
          "PicTree는 서비스 제공에 필요한 최소한의 개인정보를 수집합니다. 선택 동의 항목은 동의하지 않아도 서비스 이용에 제한이 없습니다.",
      },
    ],
  },
  {
    label: "개인정보 처리 기준",
    cards: [
      {
        icon: <IconDoc />,
        title: "제3자 제공",
        body:
          "PicTree는 이용자의 개인정보를 사전 동의 없이 제3자에게 제공하지 않습니다. 단, 법령상 근거가 있거나 수사기관 등 적법한 절차에 따른 요청이 있는 경우에는 예외적으로 제공될 수 있습니다.",
      },
      {
        icon: <IconDb />,
        title: "처리위탁",
        body:
          "정식 출시 시 서버 호스팅, 데이터 보관, 결제 처리, 알림 발송 등 업무를 외부 업체에 위탁할 수 있습니다. 위탁이 발생하는 경우 수탁자, 위탁 업무 내용, 보유 및 이용 기간을 개인정보 처리방침에 공개합니다.",
      },
      {
        icon: <IconTrash />,
        title: "보관 및 파기",
        body:
          "사진, 기록, 위치정보는 회원 탈퇴 시까지 보관되며 탈퇴하면 지체 없이 파기됩니다. 관계 법령상 보존이 필요한 경우 해당 기간 동안만 별도로 보관한 뒤 파기합니다. 사용자는 앱 내 삭제 기능으로 기록, 동선, 초안 등을 직접 삭제할 수 있습니다.",
      },
    ],
  },
  {
    label: "동의 철회 및 이용자 권리",
    cards: [
      {
        icon: <IconBell />,
        title: "알림 수신 및 철회",
        body:
          "서비스 알림과 마케팅 알림은 구분하여 관리합니다. 마케팅·이벤트 알림은 선택 동의 항목이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다. 알림 수신은 앱 설정 또는 기기 설정에서 언제든 철회할 수 있습니다.",
      },
      {
        icon: <IconPerson />,
        title: "이용자 권리",
        body:
          "사용자는 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 선택 동의 항목은 언제든 철회할 수 있으며, 필수 동의 철회 시 서비스 제공에 필요한 범위에서 이용이 제한될 수 있습니다.",
      },
    ],
  },
  {
    label: "문의 및 고지",
    cards: [
      {
        icon: <IconShield />,
        title: "개인정보 보호책임자 및 문의",
        body:
          "개인정보 또는 위치정보 처리와 관련한 문의는 PicTree 고객지원 채널로 접수합니다. 정식 출시 전에는 seangwon20@gmail.com으로 문의할 수 있으며, 실제 출시 시 사업자 정보와 개인정보 보호책임자 정보를 최신 내용으로 고지합니다.",
      },
      {
        icon: <IconInfo />,
        title: "출시 전 안내",
        body: "실제 출시 시 사업자 정보와 개인정보 보호책임자 정보를 최신 내용으로 고지합니다.",
      },
    ],
  },
];

function PolicyCardView({ card }: { card: PolicyCard }) {
  return (
    <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-4">
      <div className="flex items-center gap-2.5">
        {card.icon}
        <h3 className="text-base font-bold text-[#2C3930]">{card.title}</h3>
      </div>

      {card.fields && (
        <dl className="mt-3 flex flex-col gap-2">
          {card.fields.map((field) => (
            <div key={field.label} className="flex gap-3">
              <dt className="w-9 flex-shrink-0 text-xs font-medium text-[#9CAB84]">
                {field.label}
              </dt>
              <dd className="flex-1 text-xs leading-relaxed text-[#2C3930]">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {card.body && (
        <p className="mt-2.5 text-xs leading-relaxed text-[#6E6E6E]">{card.body}</p>
      )}
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF7] pb-28">
      {/* 헤더 */}
      <header className="bg-[#C5D89D] px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-xl font-bold text-black">개인정보 처리방침</h1>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 pt-5">
        {SECTIONS.map((section) => (
          <section key={section.label}>
            <h2 className="mb-2 pl-1 text-[15px] font-semibold text-[#9CAB84]">
              {section.label}
            </h2>
            <div className="flex flex-col gap-3">
              {section.cards.map((card) => (
                <PolicyCardView key={card.title} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
