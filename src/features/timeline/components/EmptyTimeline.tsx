import { useNavigate } from "react-router-dom";

import { EmptyState, SproutIllustration } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";

/**
 * 기록이 하나도 없을 때의 타임라인.
 *
 * 얼개·간격·CTA 색은 공용 `EmptyState` 가 갖는다(이슈 #274) — 세 탭이 같은 높이에서
 * 글을 시작해야 탭을 옮길 때 화면이 안 흔들린다. 여기서 정하는 것은 **새싹 그림과
 * 그 그림이 끝나는 시점**뿐이다.
 *
 * ⚠️ **검색 결과가 없을 때는 이 화면을 쓰지 않는다.** 그건 기록이 없는 게 아니라
 * 이번 검색어에 안 걸린 것뿐이라, 새싹과 "첫 기록 남기기" 를 띄우면 사실과 어긋난다.
 */
export function EmptyTimeline() {
  const navigate = useNavigate();

  return (
    <EmptyState
      illustration={<SproutIllustration className="animate-fade-in-up w-[164px]" />}
      title="아직 심은 기록이 없어요"
      description={
        <>
          사진을 찍으면 그 자리에
          <br />
          나무 한 그루가 자라요.
        </>
      }
      /* 새싹은 짧게 끝난다 — 글이 곧바로 따라붙는다. */
      revealDelay={150}
      action={{
        label: "첫 기록 남기기",
        /*
          카메라는 지도 안이 아니라 독립 라우트라, 지도 탭을 거치지 않고 바로 촬영으로
          보낸다 (지도의 '장소 기록하기' 버튼과 같은 이동).
        */
        onClick: () => navigate(ROUTES.camera),
      }}
    />
  );
}
