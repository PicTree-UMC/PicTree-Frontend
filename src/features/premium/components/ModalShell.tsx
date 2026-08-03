import type { PropsWithChildren } from 'react';
import { Sheet } from '@/shared/components';

type ModalShellProps = PropsWithChildren<{
  bottom?: boolean;
  /** 하단 시트일 때만 쓴다 — 손잡이를 끌거나 탭해서 닫는다. */
  onClose?: () => void;
}>;

/**
 * 결제 화면의 모달/시트 껍데기.
 *
 * `bottom` 이면 공용 `Sheet` 로 넘긴다. 가운데 모달은 아직 여기 남아 있다 —
 * `Sheet` 는 바닥에 붙는 시트만 다룬다.
 */
export function ModalShell({ children, bottom = false, onClose }: ModalShellProps) {
  if (bottom) {
    return (
      <Sheet
        onClose={onClose ?? (() => {})}
        // onClose 를 안 주면 끌어도 닫을 곳이 없다. 손잡이를 숨겨 못 미더운 손짓을 만들지 않는다.
        handle={onClose !== undefined}
        animateIn={false}
        z={60}
        className="rounded-t-[22px] bg-[#fffcef]"
        contentClassName="px-5 pt-4"
        bottomPadding="1.5rem"
      >
        {children}
      </Sheet>
    );
  }

  return (
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full -translate-x-1/2 items-center justify-center bg-black/50 sm:max-w-[390px]">
      <section
        className="mx-5 w-full rounded-[20px] bg-[#fffcef] px-5 pb-6 pt-10"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </section>
    </div>
  );
}
