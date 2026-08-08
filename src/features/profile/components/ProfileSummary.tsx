import type { ReactNode } from "react";
import { useInView } from "@/shared/hooks/useInView";
import { usePictreeToken } from "@/features/premium/hooks/usePictreeToken";
import { useMySubscription } from "@/features/premium/hooks/useMySubscription";
import { useSubscriptionPlans } from "@/features/premium/hooks/useSubscriptionPlans";
import {
  FEATURE_CODE,
  findFeature,
  planPriceLabel,
} from "@/features/premium/lib/planDisplay";
import { getPlanLabel, getStorageLimitBytes } from "../lib/plan";
import { formatBytes } from "../lib/formatBytes";
import { useStorageUsage } from "../hooks/useStorageUsage";

/**
 * 요약 한 덩어리 — 제목 + 값 + 부연.
 *
 * **카드가 아니다.** 위쪽 목록은 누를 줄이 모여 있어 흰 카드로 묶어야 어디까지가 한
 * 묶음인지 보이지만, 여기는 읽고 마는 값이라 묶을 것이 없다. 테두리를 두르면 누를 수
 * 있다는 신호가 되고(위 카드들이 전부 눌린다), 띠 배경 위에 흰 판이 또 얹혀 층이
 * 하나 더 생긴다. 경계는 여백이 만든다.
 */
function SummaryBlock({
  title,
  value,
  note,
  children,
}: {
  title: string;
  /** 큰 값 한 줄. 아직 모르면 `null` — 그 자리는 스켈레톤으로 둔다. */
  value?: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[20px] font-medium text-[#2C3930]">{title}</h2>

      {children}

      {value !== undefined &&
        (value === null ? (
          <div className="mt-2 h-5 w-24 animate-pulse rounded bg-[#EDE4C4]" />
        ) : (
          <p className="mt-1.5 text-[17px] font-medium text-[#2C3930]">{value}</p>
        ))}

      {note && <p className="mt-0.5 text-[13px] text-[#60655C]">{note}</p>}
    </section>
  );
}

/**
 * 마이페이지 맨 아래 요약 — 요금제 · 사진 저장 용량 · PICTREE 토큰.
 *
 * **띠 하나로 깔린다.** 배경(`#F6F0D7`)이 크림 본문에서 이 영역을 떼어 내는 유일한
 * 장치다 — 위는 눌러서 무언가 하는 곳이고 여기는 상태를 읽는 곳이라, 같은 바닥에
 * 이어 두면 목록이 그냥 길어진 것처럼 읽힌다. 참고한 iCloud 도 이 자리를 카드가 아니라
 * 배경이 다른 띠로 둔다.
 *
 * **읽기 전용이다.** 셋 다 누를 곳이 없다. iCloud 는 블록마다 화살표를 달지만 거기는
 * 블록마다 갈 관리 화면이 따로 있고, 우리는 셋 다 `/premium` 한 곳으로 간다 — 같은 곳으로
 * 가는 화살표 세 개는 서로 다른 곳으로 가는 것처럼 읽힌다. 위 목록의 '구독' 줄이 그 문이다.
 *
 * 사용량 계산이 비싸서(나무 수만큼 요청) **화면에 들어와야 시작한다** — `useStorageUsage`
 * 주석 참고.
 */
export function ProfileSummary() {
  /*
    임계값이 기본 0.3 이 아니라 0.1 이다. 이 띠는 300px 가까이 되는데 30% 를 채우려면
    거의 다 올라와야 해서 값이 늦게 뜬다. 한 번 재면 그만이라 `once`.
  */
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.1, once: true });

  const { data: subscription } = useMySubscription();
  const { data: plans, isPending: isPlansPending } = useSubscriptionPlans();
  const { monthlyLimit, remaining, isPending: isTokenPending } = usePictreeToken();
  const { data: storageUsed } = useStorageUsage(inView);

  /**
   * ⚠️ `subscription` 이 있다고 유료가 아니다 — 구독한 적 없는 사용자에게도 서버가
   * `plan` 을 채워 준다. 여기서는 **어느 요금제의 값을 읽을지**만 정하면 되므로
   * 코드만 꺼내 쓰고, 못 받았으면 무료로 본다.
   */
  const planCode = subscription?.plan.code ?? "FREE";
  const planDto = plans?.find((plan) => plan.code === planCode);

  /*
    이름·가격은 서버 요금제가 유일한 출처다. 아직 못 받았으면 이름만 코드에서 뽑고
    (`getPlanLabel`) 가격은 비운다 — 값을 지어내면 실제와 다른 금액이 뜬다.

    다음 결제일은 여기 두지 않는다. 그 날짜는 '해지하면 언제까지 쓰는가' 의 답이라
    해지 버튼 옆(`/premium` 푸터)에 있어야 뜻이 서고, 두 화면에 같은 날짜를 두면
    한쪽이 낡은 채로 남는다.
  */
  const planName = planDto?.name ?? getPlanLabel(planCode);
  const priceLabel = planDto ? planPriceLabel(planDto) : null;

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
  const isUsageKnown = storageUsed !== undefined;
  const usageRatio =
    isUsageKnown && storageLimit > 0 ? storageUsed / storageLimit : 0;
  const usagePercent = Math.max(0, Math.min(100, usageRatio * 100));

  return (
    /*
      본문 컨테이너(px-5)를 벗어나 화면 폭을 다 쓴다 — 띠가 좌우 여백에서 끊기면
      배경이 바뀐 게 아니라 넓은 카드 하나가 놓인 것처럼 보인다. 그래서 가로 패딩을
      이 안에서 다시 준다.

      **가로 패딩이 56px 로 위 카드들(20px)보다 훨씬 넓다.** 글이 안쪽으로 모이면서
      시선이 가운데로 몰린다 — 참고한 iCloud 가 이 자리에서 쓰는 장치이고, 여백 자체가
      '여기부터는 훑어보는 자리' 라는 신호가 된다. 좁히면 위 목록과 같은 줄맞춤이 되어
      배경만 다른 목록처럼 읽힌다.

      `flex-1` 은 내용이 짧을 때 띠가 화면 바닥까지 내려가게 하고, `pb-nav` 는 탭바에
      가리는 것을 막는다. **이 여백은 원래 페이지 루트에 있었다** — 거기 두면 그 자리가
      크림으로 남아 띠가 탭바 위에서 끊긴다. 배경을 바닥까지 잇는 게 이 패딩의 일이다.
    */
    <section
      ref={ref}
      className="mt-8 flex flex-1 flex-col gap-8 bg-[#F6F0D7] px-14 pt-9 pb-nav"
    >
      <SummaryBlock
        title="요금제"
        value={isPlansPending && !planDto ? null : planName}
        note={priceLabel}
      />

      {/*
        제목이 '저장 공간' 이 아니라 '사진 저장 용량' 이다. 이 값은 **사진 바이트만** 세고
        사진 없는 기록은 상한이 없다. 종전엔 그 사정을 아래 한 줄로 적었는데 지웠으므로,
        이제 제목이 그 말을 혼자 해야 한다 — '저장 공간' 으로 넓히면 상한이 없는 것까지
        센 값처럼 읽힌다.
      */}
      <SummaryBlock title="사진 저장 용량">
        <div
          role="progressbar"
          aria-label="사진 저장 용량 사용률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usagePercent)}
          /* 띠(#F6F0D7) 위라 트랙을 한 단 더 진하게 둔다 — 흰 카드 위 #D9D9D9 는 여기서 뜬다. */
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E0D5AF]"
        >
          <div
            className="h-full rounded-full bg-[#5B6B38] transition-[width]"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <p className="mt-2 text-[17px] font-medium text-[#2C3930]">
          {isUsageKnown ? formatBytes(storageUsed) : "-"} 사용 중
        </p>
        <p className="mt-0.5 text-[13px] text-[#60655C]">
          {formatBytes(storageLimit)} 중{isUsageKnown && ` ${Math.round(usagePercent)}%`}
        </p>
      </SummaryBlock>

      <SummaryBlock
        title="PICTREE 토큰"
        /*
          잔량을 알면 잔량이 주인공이고, 모르면 한도만 말한다 — "몇 번 남았다" 를 지어내지
          않는다(`usePictreeToken` 의 `usedThisMonth` 주석에 왜인지 적어 뒀다). 사용량
          API 가 붙으면 `remaining` 이 차면서 이 자리가 저절로 잔량으로 바뀐다.
        */
        value={
          isTokenPending && monthlyLimit === null
            ? null
            : monthlyLimit === null
              ? "-"
              : remaining !== null
                ? `${remaining}회 남음`
                : monthlyLimit === 0
                  ? "이용할 수 없어요"
                  : `월 ${monthlyLimit}회`
        }
        /*
          부연은 잔량을 알 때만 붙는다. "한 편 만들 때 1회 써요" 같은 설명은 뺐다 — 이 띠는
          값을 훑는 자리지 기능을 설명하는 자리가 아니고, 세 덩어리 중 하나만 두 줄로
          길어지면 그 블록이 혼자 무거워진다. 토큰이 무엇인지는 /premium 이 말한다.

          `이번 달 N회 중` 은 설명이 아니라 위 용량 블록의 `20GB 중 0%` 와 같은 자리다 —
          큰 값이 무엇에 대한 비율인지 받쳐 주는 줄이라 남긴다.
        */
        note={
          remaining !== null && monthlyLimit !== null
            ? `이번 달 ${monthlyLimit}회 중`
            : undefined
        }
      />
    </section>
  );
}
