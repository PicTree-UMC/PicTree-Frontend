import type { ReactNode } from "react";
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
 */
function StatTile({
  icon,
  value,
  label,
}: {
  /** 이모지 한 글자. ⚠️ 자리표시다 — 아이콘 자산이 생기면 여기만 갈아끼운다. */
  icon: string;
  /** 큰 값. 아직 모르면 `null` — 그 자리는 스켈레톤으로 둔다. */
  value: ReactNode;
  label: string;
}) {
  return (
    /* 껍데기는 `SettingsList` 의 카드와 같은 값이다 — 같은 바닥에 놓이는 흰 면이라
       한쪽만 그림자를 쓰면 두 카드가 다른 높이에 떠 있는 것처럼 보인다. */
    <div className="flex items-center gap-[11px] rounded-xl border border-[#ECECEC] bg-white p-[13px]">
      <span
        aria-hidden
        className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-[#ECF6D8] text-[16px] leading-none"
      >
        {icon}
      </span>

      <div className="min-w-0">
        {value === null ? (
          /* 흰 칸 위라 크림 띠의 #EDE4C4 가 아니라 헤어라인 회색을 쓴다. */
          <div className="h-[23px] w-12 animate-pulse rounded bg-[#ECECEC]" />
        ) : (
          <p className="text-[20px] font-medium leading-tight text-[#2C3930]">{value}</p>
        )}
        <p className="mt-px truncate text-[13px] text-[#60655C]">{label}</p>
      </div>
    </div>
  );
}

/**
 * 마이페이지 첫 섹션 — 심은 나무 · 사진 · 요금제 · 토큰 + 사진 저장 용량.
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
 * **여전히 읽기 전용이다.** 카드가 됐다고 눌리지 않는다 — 다섯 칸이 전부 `/premium`
 * 한 곳으로 갈 텐데, 같은 곳으로 가는 문 다섯 개는 서로 다른 곳처럼 읽힌다.
 * 아래 목록의 '구독' 줄이 그 문이다.
 *
 * **타일은 쌓은 것, 줄은 폭이 필요한 것.** 나무·사진·요금제·토큰은 값 하나로 끝나서
 * 칸에 들어가고, 사진 저장 용량은 막대 + `100MB 중 42MB` 까지 있어야 뜻이 서므로
 * 전폭 줄이다. **막대가 이 화면에서 유일하게 '한도까지 얼마나 남았나'를 말한다** —
 * 퍼센트 숫자만 남기면 그 말이 사라진다.
 *
 * ⚠️⚠️ **`useInView` 게이트가 사라졌다 — 이 자리로 올라오면서 성립하지 않게 됐다.**
 * 그 게이트는 "요약은 접힌 화면 아래에 있으니 거기까지 내려온 사람에게만 센다" 는
 * 것이었는데, 머리글 바로 아래면 열자마자 보인다. 남겨 둬도 즉시 통과하므로
 * **가리는 척만 하는 코드**가 된다.
 *
 * 그래서 지금은 **마이페이지에 들어올 때마다 사진 순회가 돈다**(나무 수만큼 요청).
 * `staleTime: Infinity` 라 한 세션 안에서는 한 번이지만, 새로고침하거나 사진을
 * 올리고/지워 캐시가 깨지면 다음 진입에서 또 돈다. 나무 34그루면 35요청이다.
 *
 * 줄이려면 **화면이 아니라 서버 쪽에서** 줄여야 한다 — 백엔드에 요청해 둔
 * `SUM(file_size)` 한 방짜리 API 가 그것이다(`storageApi` 주석). 그게 생기면
 * 이 계산이 통째로 사라진다. 그 전에 진입이 무겁게 느껴지면, 게이트를 되살리는 게
 * 아니라 **나무 목록(요청 1~2회)과 사진 순회를 갈라** 그루 수·요금제·토큰을 먼저
 * 채우는 쪽이 맞다.
 */
export function ProfileSummary() {
  const { data: subscription } = useMySubscription();
  const { data: plans, isPending: isPlansPending } = useSubscriptionPlans();
  const { monthlyLimit, remaining, isPending: isTokenPending } = usePictreeToken();
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
  const isUsageKnown = stats !== undefined;
  const usageRatio =
    isUsageKnown && storageLimit > 0 ? stats.usedBytes / storageLimit : 0;
  const usagePercent = Math.max(0, Math.min(100, usageRatio * 100));

  return (
    /*
      가로 패딩·배경이 없다. 배경이 크림으로 통일되면서 이 영역은 **본문 컨테이너 안**
      으로 들어왔고, `px-5` 와 위아래 간격(`gap-6`)은 `ProfilePage` 가 준다.

      한때는 화면 폭을 다 쓰는 띠였고 가로 패딩이 56px 이었다. 그 넓은 여백은 글만 있을 때
      '훑어보는 자리' 라는 신호였는데, 칸이 들어오면서 그 일을 칸이 한다 — 그리고 56px 을
      유지하면 타일 두 칸이 130px 로 좁아져 라벨이 잘린다(위 `StatTile` 주석 참고).

      `flex-1`·`pb-nav` 도 뺐다. 둘 다 이 영역이 페이지 **마지막** 자식이라 배경을 탭바까지
      이어야 했을 때의 것이다. 지금은 머리글과 목록 사이에 끼므로 자기 높이만 차지하고,
      탭바 여백은 페이지 루트가 갖는다.
    */
    <section className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile
          icon="🌳"
          value={stats?.treeCount ?? null}
          label="심은 나무"
        />
        <StatTile icon="📷" value={stats?.photoCount ?? null} label="사진" />
        <StatTile
          icon="✨"
          value={isPlansPending && !planDto ? null : planName}
          label="요금제"
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
          {isUsageKnown ? `${formatBytes(stats.usedBytes)} 사용 중` : "-"}
        </p>
      </section>
    </section>
  );
}
