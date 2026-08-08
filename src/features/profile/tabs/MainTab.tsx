import { ProfileSummary } from "../components/ProfileSummary";
import { CalendarPreview } from "../components/CalendarPreview";
import { FavoritesPreview } from "../components/FavoritesPreview";

/**
 * 마이페이지 ① 메인 탭 — **내가 여기 얼마나 쌓았나**.
 *
 * 위에서 아래로 값이 점점 구체화된다: 숫자 넷(나무·사진·요금제·토큰) → 한도까지 얼마나
 * 남았나(용량 막대) → 이번 달 어떻게 채웠나(캘린더) → 무엇을 담아 뒀나(즐겨찾기).
 * 앞의 둘은 세어 준 값이고 뒤의 둘은 실제 기록이라, 미리보기 카드 둘을 아래에 둔다.
 *
 * **설정 목록(옛 `SettingsList` 두 벌)이 사라졌다.** 개인정보·처리방침·FAQ 는 탭이 됐고,
 * 나머지 셋은 이 탭 안에서 **값을 보여주는 칸**이 됐다 — '구독' 줄은 요금제 타일이,
 * 여행 캘린더·즐겨찾기는 미리보기 카드가 대신한다. 같은 곳으로 가면서 가는 길에 값까지 말한다.
 *
 * ⚠️ **진입 비용은 여전히 사진 순회가 지배한다**(`ProfileSummary` 주석). 여기 붙은 미리보기
 * 둘은 각각 요청 1회다(`GET /calendar` · `GET /trees/favorites`) — 무거운 쪽은 그 둘이 아니다.
 */
export function MainTab() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <ProfileSummary />
      <CalendarPreview />
      <FavoritesPreview />
    </div>
  );
}
