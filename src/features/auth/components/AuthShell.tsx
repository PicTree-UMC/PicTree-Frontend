import type { PropsWithChildren } from 'react';


export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-full items-center justify-center bg-[#fbf8ed] px-5 py-8 text-[#263122]">
      <section className="relative flex min-h-[780px] w-full max-w-[390px] flex-col overflow-y-auto bg-[#fffdf4] px-6 pb-10 pt-3 shadow-sm">
        {children}
      </section>
    </main>
  );
}
