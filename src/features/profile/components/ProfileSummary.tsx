import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { usePictreeToken } from "@/features/premium/hooks/usePictreeToken";
import { useMySubscription } from "@/features/premium/hooks/useMySubscription";
import { useSubscriptionPlans } from "@/features/premium/hooks/useSubscriptionPlans";
import {
  FEATURE_CODE,
  findFeature,
  planShortName,
} from "@/features/premium/lib/planDisplay";
import { getPlanLabel, getStorageLimitBytes } from "../lib/plan";
import { formatBytes } from "../lib/formatBytes";
import { useStorageStats } from "../hooks/useStorageStats";

/**
 * 숫자 한 칸.
 *
 * **아이콘이 왼쪽, 글이 오른쪽이다.** 위 설정 목록(`SettingsRow`)도 아이콘이 왼쪽이라
 * 같은 결로 읽히고, 세로로 쌓는 것보다 칸이 22px 낮아진다 — 요약은 스크롤 맨 아래라
 * 짧을수록 좋다.
 *
 * ⚠️ **글자 자리가 103px 뿐이다**(390px 기준: 칸 170 − 안쪽 패딩 26 − 아이콘 30 − 간격 11).
 * 값이 길어질 수 있는 것은 이 칸에 넣지 않는다 — 사진 저장 용량이 아래 전폭 줄로
 * 내려가 있는 이유다(`100MB 중 42MB 사용 중` 은 여기 안 들어간다).
 * `onClick` 을 주면 꺾쇠가 붙어 그 자리가 **83px** 로 줄어든다. 지금 그 칸(요금제)의 값은
 * 서버 플랜 이름을 줄인 것(무료·플러스·프로·맥스)이라 넉넉히 들어간다.
 */
function StatTile({
  icon,
  value,
  label,
  onClick,
}: {
  /** 이모지 한 글자. ⚠️ 자리표시다 — 아이콘 자산이 생기면 여기만 갈아끼운다. */
  icon: string;
  /** 큰 값. 아직 모르면 `null` — 그 자리는 스켈레톤으로 둔다. */
  value: ReactNode;
  label: string;
  /**
   * 주면 칸이 **버튼**이 되고 오른쪽에 꺾쇠가 붙는다.
   *
   * ⚠️ 네 칸 중 **하나만** 준다(요금제 → `/premium`). 전부 누르게 하면 다섯 개가 같은
   * 곳으로 가는 문이 되어 서로 다른 곳처럼 읽힌다 — 아래 컴포넌트 주석 참고.
   */
  onClick?: () => void;
}) {
  /* 껍데기는 `SettingsList` 의 카드와 같은 값이다 — 같은 바닥에 놓이는 흰 면이라
     한쪽만 그림자를 쓰면 두 카드가 다른 높이에 떠 있는 것처럼 보인다. */
  const className =
    "flex w-full items-center gap-[11px] rounded-xl border border-[#ECECEC] bg-white p-[13px] text-left";

  const content = (
    <>
      <span
        aria-hidden
        className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-[#ECF6D8] text-[16px] leading-none"
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        {value === null ? (
          /* 흰 칸 위라 크림 띠의 #EDE4C4 가 아니라 헤어라인 회색을 쓴다. */
          <div className="h-[23px] w-12 animate-pulse rounded bg-[#ECECEC]" />
        ) : (
          <p className="truncate text-[20px] font-medium leading-tight text-[#2C3930]">
            {value}
          </p>
        )}
        <p className="mt-px truncate text-[13px] text-[#60655C]">{label}</p>
      </div>

      {onClick && (
        // 비활성 회색(§1.1). `SettingsRow`(18px)보다 한 단 작다 — 칸이 좁다.
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-[#B4B4B4]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  if (!onClick) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/**
 * 메인 탭 첫 덩어리 — 심은 나무 · 사진 · 요금제 · 토큰 + 사진 저장 용량.
 *
 * 아래로 여행 캘린더·즐겨찾기 미리보기가 이어진다(`MainTab`). 이 다섯은 **세어 준 값**이고
 * 그 둘은 **실제 기록**이라, 요약이 먼저다.
 *
 * ⚠️ **#197 의 결정을 두 군데 뒤집었다.**
 *
 * 1. **흰 카드를 쓴다.** 그때는 "배경 위에 흰 판이 또 얹히면 층이 하나 더 생기고,
 *    테두리가 있으면 눌리는 것처럼 보인다"는 이유로 카드를 뺐다. 값이 셋일 때는
 *    그게 맞았는데, 다섯으로 늘면서 **무엇과 무엇이 한 묶음인지**를 여백만으로는
 *    못 나누게 됐다. 지금은 칸 자체가 경계다.
 * 2. **배경 띠(`#F6F0D7`)를 걷었다.** 그 색은 "위는 하는 곳, 아래는 읽는 곳" 을
 *    가르는 장치였다. 이 영역이 목록 **위**로 올라오면서 가를 것이 없어졌고,
 *    칸 모양(2×2 숫자 격자 vs 한 줄 + 화살표)이 이미 둘을 구분한다.
 *    **앱에서 크림이 아닌 페이지는 `/premium` 하나** 라는 규칙(§1.2)에도 이쪽이 맞다.
 *
 * **다섯 칸 중 눌리는 것은 요금제 하나뿐이다** — `/premium` 으로 간다. 옛 설정 목록의
 * '구독' 줄이 하던 일이고, 이 화면에서 요금제 화면으로 가는 **유일한** 문이다.
 *
 * ⚠️ 한때 다섯 칸을 전부 읽기 전용으로 뒀다. "다 눌러도 결국 `/premium` 한 곳인데, 같은
 * 곳으로 가는 문 다섯 개는 서로 다른 곳처럼 읽힌다" 는 이유였고 **그 이유는 지금도 맞다** —
 * 그래서 늘린 게 아니라 **하나만** 열었다. 나무·사진·토큰 칸에 `onClick` 을 달지 말 것.
 *
 * 눌리는 칸과 아닌 칸은 **꺾쇠 유무**로 갈린다(`StatTile`). 아래 미리보기 카드 둘도 같은
 * 규칙이라, 화면 전체에서 "꺾쇠가 있으면 어딘가로 간다" 하나로 읽힌다.
 *
 * **타일은 쌓은 것, 줄은 폭이 필요한 것.** 나무·사진·요금제·토큰은 값 하나로 끝나서
 * 칸에 들어가고, 사진 저장 용량은 막대 + `100MB 중 42MB` 까지 있어야 뜻이 서므로
 * 전폭 줄이다. **막대가 이 화면에서 유일하게 '한도까지 얼마나 남았나'를 말한다** —
 * 퍼센트 숫자만 남기면 그 말이 사라진다.
 *
 * ⚠️ **`useInView` 게이트는 없다 — 이 자리로 올라오면서 성립하지 않게 됐다.**
 * 그 게이트는 "요약은 접힌 화면 아래에 있으니 거기까지 내려온 사람에게만 센다" 는
 * 것이었는데, 머리글 바로 아래면 열자마자 보인다. 남겨 둬도 즉시 통과하므로
 * **가리는 척만 하는 코드**가 된다. 되살릴 이유도 없어졌다 — 그 게이트가 막던
 * 나무별 사진 순회(34그루면 35요청)가 `GET /trees/summary` 한 요청으로 줄었다.
 */
export function ProfileSummary() {
  const navigate = useNavigate();
  const { data: subscription } = useMySubscription();
  const { data: plans, isPending: isPlansPending } = useSubscriptionPlans();
  const { monthlyLimit, remaining, isPending: isTokenPending } = usePictreeToken();
  /*
    그루 수·사진 장수·용량이 한 응답으로 온다(`GET /trees/summary`). 한때 그루 수만
    별개 쿼리(`useTreeCount`)로 갈라 뒀던 건 나머지 둘이 나무별 순회에서 나와 느렸기
    때문이다 — 순회가 없어지면서 가를 이유도 없어졌다.
  */
  const { data: stats } = useStorageStats();

  /**
   * ⚠️ `subscription` 이 있다고 유료가 아니다 — 구독한 적 없는 사용자에게도 서버가
   * `plan` 을 채워 준다. 여기서는 **어느 요금제의 값을 읽을지**만 정하면 되므로
   * 코드만 꺼내 쓰고, 못 받았으면 무료로 본다.
   */
  const planCode = subscription?.plan.code ?? "FREE";
  const planDto = plans?.find((plan) => plan.code === planCode);

  /*
    이름은 서버 요금제가 유일한 출처다. 아직 못 받았으면 코드에서 뽑는다(`getPlanLabel`).

    ⚠️ **가격은 이제 안 보여준다.** 칸에 값 한 줄과 라벨 한 줄뿐이라 자리가 없고,
    금액은 결제할 수 있는 `/premium` 에 있어야 뜻이 선다 — 마이페이지에서 액수만 봐서는
    할 수 있는 게 없다. 되살리려면 요금제를 타일에서 빼 전폭 줄로 내려야 한다.
  */
  const planName = planShortName(planDto?.name ?? getPlanLabel(planCode));

  const storageMb = planDto
    ? findFeature(planDto, FEATURE_CODE.photoStorage)?.limitValue
    : null;
  // 서버 용량이 오면 그걸 쓰고, 아직이면 lib/plan.ts 의 시안 값으로 버틴다.
  const storageLimit =
    storageMb != null ? storageMb * 1024 ** 2 : getStorageLimitBytes(planCode);

  /*
    사용량을 모를 때 막대를 0% 로 두고 수치를 `-` 로 둔다. 지어내지 않는다 — 기록이
    하나도 없는데 절반이 찼다고 하는 화면이 나오면 사용자는 그게 틀렸다는 걸 알 방법이
    없다. (구 StorageCard 에서 그대로 가져온 규칙이다.)
  */
  const usedBytes = stats?.usedBytes ?? null;
  const isUsageKnown = usedBytes !== null;
  const usageRatio =
    isUsageKnown && storageLimit > 0 ? usedBytes / storageLimit : 0;
  const usagePercent = Math.max(0, Math.min(100, usageRatio * 100));

  return (
    /*
      가로 패딩·배경이 없다. 배경이 크림으로 통일되면서 이 영역은 **본문 컨테이너 안**
      으로 들어왔고, `px-5` 와 위아래 간격(`gap-6`)은 `MainTab` 이 준다 — 아래 미리보기
      카드 둘과 같은 값을 나눠 쓴다.

      한때는 화면 폭을 다 쓰는 띠였고 가로 패딩이 56px 이었다. 그 넓은 여백은 글만 있을 때
      '훑어보는 자리' 라는 신호였는데, 칸이 들어오면서 그 일을 칸이 한다 — 그리고 56px 을
      유지하면 타일 두 칸이 130px 로 좁아져 라벨이 잘린다(위 `StatTile` 주석 참고).

      `flex-1`·`pb-nav` 도 뺐다. 둘 다 이 영역이 페이지 **마지막** 자식이라 배경을 탭바까지
      이어야 했을 때의 것이다. 지금은 탭 본문 맨 위라 자기 높이만 차지하고, 탭바 여백은
      `ProfilePage` 루트가 갖는다.
    */
    <section className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile icon="🌳" value={stats?.treeCount ?? null} label="심은 나무" />
        <StatTile icon="📷" value={stats?.photoCount ?? null} label="사진" />
        <StatTile
          icon="✨"
          value={isPlansPending && !planDto ? null : planName}
          label="요금제"
          /*
            요금제 화면으로 가는 문. 값(플랜 이름)이 아직 안 왔어도 눌리게 둔다 —
            요금제를 못 받은 것이야말로 저쪽에서 다시 시도할 일이고, 그쪽 화면에
            로딩·에러·재시도가 이미 있다.
          */
          onClick={() => navigate(ROUTES.premium)}
        />
        <StatTile
          icon="✍️"
          /*
            잔량을 알면 잔량이 주인공이고, 모르면 한도만 말한다 — "몇 번 남았다" 를
            지어내지 않는다(`usePictreeToken` 의 `usedThisMonth` 주석에 왜인지 적어 뒀다).
            사용량 API 가 붙으면 `remaining` 이 차면서 이 자리가 저절로 잔량으로 바뀐다.
          */
          value={
            isTokenPending && monthlyLimit === null
              ? null
              : monthlyLimit === null
                ? "-"
                : remaining !== null
                  ? `${remaining}회`
                  : monthlyLimit === 0
                    ? "없음"
                    : `${monthlyLimit}회`
          }
          label={remaining !== null ? "남은 토큰" : "이번 달 토큰"}
        />
      </div>

      {/*
        제목이 '저장 공간' 이 아니라 '사진 저장 용량' 이다. 이 값은 **사진 바이트만** 세고
        사진 없는 기록은 상한이 없다 — '저장 공간' 으로 넓히면 상한이 없는 것까지 센
        값처럼 읽힌다.
      */}
      <section className="rounded-xl border border-[#ECECEC] bg-white p-[15px]">
        <div className="flex items-baseline">
          <h2 className="text-[15px] font-medium text-[#2C3930]">사진 저장 용량</h2>
          <span className="ml-auto text-[15px] font-medium text-[#2C3930]">
            {isUsageKnown ? `${Math.round(usagePercent)}%` : "-"}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="사진 저장 용량 사용률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usagePercent)}
          /*
            ⚠️ 트랙이 #E0D5AF 에서 #D9D9D9 로 바뀌었다. 그 값은 크림 띠(#F6F0D7) 위라
            한 단 진하게 고른 것이었는데, 막대가 흰 칸 안으로 들어오면서 근거가 뒤집혔다 —
            띠 기준 색을 흰 바닥에 그대로 두면 필요 이상으로 탁해진다.
          */
          className="mt-[11px] h-2 w-full overflow-hidden rounded-full bg-[#D9D9D9]"
        >
          <div
            className="h-full rounded-full bg-[#5B6B38] transition-[width]"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <p className="mt-[7px] text-[13px] text-[#60655C]">
          {formatBytes(storageLimit)} 중{" "}
          {isUsageKnown ? `${formatBytes(usedBytes)} 사용 중` : "-"}
        </p>
      </section>
    </section>
  );
}
