import type { PropsWithChildren } from 'react';


export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-full w-full justify-center bg-[#FFFCEF] text-[#263122]">
      <section className="relative flex min-h-full w-full max-w-[390px] flex-col overflow-y-auto bg-[#FFFCEF] px-6 pb-10 pt-3">
        {children}
      </section>
    </main>
  );
}
