import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabs } from "./components/ProfileTabs";
import { MainTab } from "./tabs/MainTab";
import { AccountTab } from "./tabs/AccountTab";
import { HelpTab } from "./tabs/HelpTab";

/** 어느 탭이 열려 있나. 경로가 정한다 — 라우터가 이 값을 박아 넘긴다(`routes.ts` 주석). */
export type ProfileTab = "main" | "account" | "help";

/**
 * 마이페이지 — 머리글 하나에 탭 셋.
 *
 * | 탭 | 내용 | 경로 |
 * |---|---|---|
 * | 메인 | 심은 나무·사진·요금제·토큰 · 사진 저장 용량 · 캘린더/즐겨찾기 미리보기 | `/profile` |
 * | 프로필 | 닉네임·이메일·결제 수단·로그아웃/탈퇴 | `/profile/me` |
 * | 질문 | FAQ + 개인정보 처리방침 줄 | `/profile/help` |
 *
 * **옛 얼개(요약 + 설정 목록 두 벌)는 통째로 사라졌다.** 목록의 여섯 줄 중 셋은 탭이 됐고
 * (개인정보·처리방침·FAQ), 나머지 셋은 메인 탭에서 **값을 보여주는 칸**이 됐다 —
 * 구독은 요금제 타일, 여행 캘린더·즐겨찾기는 미리보기 카드다. 줄을 눌러 들어가야 뭐가
 * 있는지 알던 화면에서, 열자마자 보이는 화면으로 바뀐 것이 이 재디자인의 요지다.
 *
 * `/premium` 은 탭이 아니라 **밖으로 나가는 화면**이다 — 이유는 `routes.ts` 의 `profile` 주석.
 */
export function ProfilePage({ tab }: { tab: ProfileTab }) {
  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      {/*
        네 탭이 공유하는 위쪽. 탭을 바꿔도 여기는 그대로 있어서 화면이 통째로 갈리는 대신
        아래만 바뀐다 — 상단 탭이 하는 일이 그것이다.
      */}
      <div>
        <ProfileHeader />
        <ProfileTabs />
      </div>

      {tab === "main" ? <MainTab /> : tab === "account" ? <AccountTab /> : <HelpTab />}
    </div>
  );
}
