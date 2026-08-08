import { NavLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

const TABS = [
  // `end` 는 메인에만 준다 — 나머지 셋이 전부 `/profile/...` 라 안 주면 어느 탭에 있든
  // 메인까지 같이 켜진다.
  { to: ROUTES.profile, label: "메인", end: true },
  { to: ROUTES.profileMe, label: "프로필" },
  { to: ROUTES.helpFaq, label: "질문" },
];

/**
 * 마이페이지 탭 줄 — 메인 · 프로필 · 질문.
 *
 * **세 칸이 화면 폭을 똑같이 나눠 갖고, 사이에 세로 구분선이 선다**(레퍼런스 그대로 —
 * 레퍼런스도 세 칸이다). 선택 표시는 **색과 굵기뿐이고 밑줄은 없다** — 구분선이 이미
 * 칸을 갈라 놓아서 밑줄까지 얹으면 한 줄에 경계선이 두 종류로 겹친다.
 *
 * ⚠️ **요금제(`/premium`)는 여기 없다.** 크림이 아닌 유일한 화면이라 탭 안에 들어오면
 * 배경이 저 혼자 튄다(`routes.ts` 의 `profile` 주석). 메인 탭의 요금제 타일이 그 문이다.
 *
 * ⚠️ **`button` 이 아니라 `NavLink` 다.** 탭이 곧 경로라(`routes.ts` 의 `profile` 주석)
 * 눌렀을 때 히스토리가 쌓여야 뒤로가기가 탭을 되짚는다. 켜짐 판정도 라우터가 하므로
 * 이 컴포넌트는 상태를 하나도 안 든다.
 *
 * **고정(sticky)하지 않는다.** 스크롤을 내리면 머리글과 함께 올라간다 — 레퍼런스가 그렇고,
 * 안전영역(`.pt-header`) 위에 붙이면 노치 밑으로 파고들어 별도 계산이 필요해진다.
 * ⚠️ 질문 탭은 아코디언을 여러 개 펼치면 길어진다. 실기기에서 탭을 되돌아오기 답답하면
 * 그때 고정으로 바꾼다 — 그때는 `top` 에 안전영역을 더해야 노치에 안 파묻힌다.
 */
export function ProfileTabs() {
  return (
    <nav aria-label="마이페이지" className="mt-4 flex items-stretch px-5">
      {TABS.map((tab, index) => (
        <div key={tab.to} className="flex min-w-0 flex-1 items-center">
          {index > 0 && <span aria-hidden className="h-4 w-px shrink-0 bg-[#ECECEC]" />}

          <NavLink
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-[15px] ${
                isActive ? "font-medium text-pictree-700" : "text-[#60655C]"
              }`
            }
          >
            {tab.label}
          </NavLink>
        </div>
      ))}
    </nav>
  );
}
