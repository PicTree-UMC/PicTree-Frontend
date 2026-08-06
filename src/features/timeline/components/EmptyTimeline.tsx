import { useNavigate } from "react-router-dom";

import { SproutIllustration } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";

/**
 * 기록이 하나도 없을 때의 타임라인.
 *
 * 예전에는 "아직 저장된 기록이 없어요." 한 줄이었다. 동선 탭은 같은 상황에서 그림과
 * 문구, 다음 행동까지 보여 주는데 타임라인만 결이 달랐다.
 *
 * 등장 순서와 모션 값은 동선 빈 화면과 똑같이 맞춘다 — `animate-fade-in-up`
 * (0.28s ease-out both) 에 0 / 150 / 300ms 지연. 같은 앱에서 두 탭이 다른 리듬으로
 * 움직이면 그게 더 눈에 띈다.
 *
 * ⚠️ **검색 결과가 없을 때는 이 화면을 쓰지 않는다.** 그건 기록이 없는 게 아니라
 * 이번 검색어에 안 걸린 것뿐이라, 새싹과 "첫 기록 남기기" 를 띄우면 사실과 어긋난다.
 */
export function EmptyTimeline() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-6 text-center">
      <SproutIllustration className="animate-fade-in-up w-[164px]" />

      <h2
        className="animate-fade-in-up mt-6 text-[17px] font-medium text-[#2C3930]"
        style={{ animationDelay: "150ms" }}
      >
        아직 심은 기록이 없어요
      </h2>
      <p
        className="animate-fade-in-up mt-2 text-[15px] leading-6 text-[#60655C]"
        style={{ animationDelay: "150ms" }}
      >
        사진을 찍으면 그 자리에
        <br />
        나무 한 그루가 자라요.
      </p>

      {/*
        카메라는 지도 안이 아니라 독립 라우트라, 지도 탭을 거치지 않고 바로 촬영으로
        보낸다 (지도의 '장소 기록하기' 버튼과 같은 이동).
      */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.camera)}
        className="animate-fade-in-up mt-7 h-[46px] rounded-[24px] bg-[#5B6B38] px-7 text-[15px] font-medium text-[#FFFCEF]"
        style={{ animationDelay: "300ms" }}
      >
        첫 기록 남기기
      </button>
    </div>
  );
}
