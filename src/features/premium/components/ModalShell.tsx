import type { PropsWithChildren } from 'react';

export function ModalShell({ children, bottom = false }: PropsWithChildren<{ bottom?: boolean }>) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <section className={`${bottom ? 'absolute bottom-0 rounded-t-[22px]' : 'rounded-[20px]'} w-full bg-[#fffdf4] px-5 pb-6 pt-10`} role="dialog" aria-modal="true">
        {bottom && <i className="absolute left-1/2 top-3 h-1 w-[132px] -translate-x-1/2 rounded-full bg-black" />}
        {children}
      </section>
    </div>
  );
}
