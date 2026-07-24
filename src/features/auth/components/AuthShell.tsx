import type { PropsWithChildren } from 'react';

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen w-full bg-[#FFFCEF] text-[#263122]">
      <section className="relative flex min-h-screen w-full flex-col overflow-y-auto bg-[#FFFCEF] px-6 pb-10 pt-3">
        
        {children}
      </section>
    </main>
  );
}
