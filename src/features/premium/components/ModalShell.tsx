import type { PropsWithChildren } from 'react';
import { useSheetDrag } from '@/shared/hooks/useSheetDrag';

type ModalShellProps = PropsWithChildren<{
  bottom?: boolean;
  /** 하단 시트일 때만 쓴다 — 손잡이를 끌거나 탭해서 닫는다. */
  onClose?: () => void;
}>;

export function ModalShell({ children, bottom = false, onClose }: ModalShellProps) {
  // 등장 애니메이션이 없는 시트라 animateIn 을 끈다.
  const { sheetRef, handleProps } = useSheetDrag<HTMLElement>({
    onClose: onClose ?? (() => {}),
    animateIn: false,
  });

  return (
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full -translate-x-1/2 items-center justify-center bg-black/50 sm:max-w-[390px]">
      <section ref={bottom ? sheetRef : undefined} className={`${bottom ? 'absolute inset-x-0 bottom-0 rounded-t-[22px]' : 'mx-5 rounded-[20px]'} w-full bg-[#fffcef] px-5 pb-6 pt-10`} role="dialog" aria-modal="true">
        {/* 손잡이는 하단 시트에만 있다. onClose 를 안 주면 끌 수 없으므로 그림으로만 둔다. */}
        {bottom &&
          (onClose ? (
            <button type="button" aria-label="닫기" {...handleProps} className="absolute inset-x-0 top-0 flex h-10 items-center justify-center">
              <i className="h-1 w-[132px] rounded-full bg-black" aria-hidden />
            </button>
          ) : (
            <i className="absolute left-1/2 top-3 h-1 w-[132px] -translate-x-1/2 rounded-full bg-black" />
          ))}
        {children}
      </section>
    </div>
  );
}
