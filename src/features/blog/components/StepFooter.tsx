import type { ReactNode } from 'react';

/**
 * 초안 만들기 각 단계의 **바닥 칸** — CTA 와 그 바로 위에 붙는 안내 한 줄이 앉는 자리.
 *
 * ⚠️ **CTA 를 본문 흐름 끝에 두지 않으려고 만든 것이다.** 종전에는 세 단계 모두 버튼이
 * 스크롤되는 내용 맨 끝에 달려 있어서, 화면이 내용보다 짧으면 버튼이 화면 밖으로
 * 밀려났다. 어체 선택(약 700px)이 iPhone 에서는 아슬하게 들어가고 갤럭시(가시영역
 * ~650px)에서는 안 들어가, **가로로 돌렸다 되돌려야 눌린다**는 제보가 그것이다.
 * 결과 확인은 초안 전문이 들어가서 아예 항상 화면 밖이었다.
 *
 * 여백·구분선 값은 동선 만들기 ①(`RouteCreatePage`)·③(`RouteSavePage`)에서 가져왔다 —
 * 두 흐름이 같은 꼴의 하단 버튼을 쓰므로 값이 갈라지면 넘어갈 때 버튼이 튄다.
 * 각자 상수를 들지 말고 이 컴포넌트를 쓸 것.
 *
 * 쓰는 쪽은 `min-h-0 flex-1 overflow-y-auto` 본문과 이것을 `flex h-full flex-col` 안에
 * 형제로 놓는다. 그래야 줄어드는 몫을 본문이 흡수하고 이 칸은 제 높이를 지킨다.
 */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-ink/10 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
      {children}
    </div>
  );
}
