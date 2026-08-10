import type { PropsWithChildren } from 'react';

/**
 * 결제 화면의 가운데 모달 껍데기. 지금은 `PaymentCompleteModal` 하나가 쓴다.
 *
 * 하단 시트 분기(`bottom`)는 지웠다 — 결제 확인이 시트에서 풀스크린으로 바뀌면서
 * 유일한 사용처가 사라졌다(`PaymentCheckoutView`).
 */
export function ModalShell({ children }: PropsWithChildren) {
  return (
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full -translate-x-1/2 items-center justify-center bg-black/50 sm:max-w-[390px]">
      <section
        className="mx-5 w-full rounded-[20px] bg-cream px-5 pb-6 pt-10"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </section>
    </div>
  );
}
