import { AnimatedCheckIcon } from './icons';
import { ModalShell } from './ModalShell';
import { FEATURE_CODE, findFeature, planSummary } from '../lib/planDisplay';
import type { SubscriptionPlanDto } from '../types/payment';

/**
 * 결제 완료 모달.
 *
 * **오래 죽어 있던 코드였다.** 결제가 토스 리다이렉트로만 이뤄지던 동안에는 성공 시점에
 * 이 화면이 없었다 — `BillingSuccessPage` 가 착지해서 곧장 블로그로 보냈다. 등록 카드로
 * 앱 안에서 끝나는 길이 생기면서 비로소 쓰인다(`PremiumPage` 의 `complete` 스텝).
 *
 * ⚠️ 그래서 글자 크기·굵기를 이번에 고쳤다 — 12px·14px·`font-bold` 로 §2(최소 13px,
 * 볼드 금지)를 어기고 있었는데, 안 보이는 화면이라 그동안 안 걸렸다.
 */
export function PaymentCompleteModal({
  plan,
  onConfirm,
}: {
  plan: SubscriptionPlanDto;
  onConfirm: () => void;
}) {
  const details = planSummary(plan);
  const adFree = findFeature(plan, FEATURE_CODE.adFree);

  return (
    <ModalShell>
      <div className="payment-check-circle mx-auto grid h-[60px] w-[60px] place-items-center rounded-full bg-pictree-300">
        <AnimatedCheckIcon />
      </div>

      <h2 className="mt-3 text-center text-[21px] font-medium text-ink">결제 완료!</h2>
      <p className="mt-1 text-center text-[13px] text-ink-muted">
        프리미엄 기능이 활성화 되었어요.
      </p>

      <div className="relative mt-5 rounded-xl border-2 border-pictree-300 bg-white px-4 py-4 text-center text-[15px] font-medium leading-8 text-ink">
        <span className="absolute -left-3 -top-4 -rotate-6 rounded-full bg-pictree-700 px-4 py-1 text-[13px] font-medium text-white">
          {details.shortName}
        </span>
        {details.shortName} 용량 업그레이드 ({details.storage})
        <br />
        AI 블로그 {details.generations} 자동 생성
        {adFree?.isEnabled && (
          <>
            <br />
            {adFree.textValue ?? adFree.name}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="mx-auto mt-6 block h-12 w-full rounded-xl bg-pictree-700 text-[17px] font-medium text-white"
      >
        확인
      </button>
    </ModalShell>
  );
}
