import type { ReactNode } from 'react';

import { useSwipeDismiss } from '@/shared/hooks/useSwipeDismiss';

import { useToastStore, ToastType, ToastPlacement, type ToastItem } from './toastStore';

/** 토스트 렌더러. 앱 최상단에 한 번만 <Toaster /> 로 마운트. */

/*
  잎 하나. 새싹 일러스트(SproutIllustration)가 앱의 성공·성장 어휘라, 성공 배지도 잎으로
  잇는다 — 참고한 플래시 메시지 팩의 "왼쪽 유기적 장식" 자리를 우리 정체성으로 채운 것이다.
*/
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function ExclamationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M12 6v7" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

/*
  옅은 유형색 카드 + 진한 배지. 종전의 "유형색으로 통째로 칠한 알약" 을 걷어냈다(#105).

  - **카드가 옅은 유형 면**(GREEN-100·error-surface·cream-sub)이고 **배지가 진한 원**
    (700·error·ink) + 흰 아이콘이다. 흰 카드안과 나란히 놓고 골랐다 — 앱이 초록 테마라
    성공 토스트의 GREEN-100 면이 정체성과 맞물리고, 가장 자주 뜨는 토스트가 성공이다.
  - 색만으로 가르지 않도록 **배지 모양도 유형마다 다르다**(잎·!·i) — 캘린더 일요일 색을
    유지한 것과 같은 근거다(색이 정보를 혼자 나르지 않는다).
  - **채도 높은 원색 카드(참고한 플래시 메시지 팩)는 일부러 안 따랐다.** 크림·뮤트 톤
    화면 위에서 원색 면은 앱보다 목소리가 커진다.
  - ⚠️ info 카드(cream-sub)는 크림 바닥에서 셋 중 가장 약하다 — 보더·그림자가 경계를
    버틴다. 알고 고른 트레이드오프다(성공·에러가 뚜렷한 쪽을 우선했다).
  - ⚠️ Tailwind 기본 팔레트 이름(`red-*`·`neutral-*`)을 쓰지 말 것 — canonical 과 값이
    다르고(#EF4444 ≠ #DC2626), ESLint 색 규칙은 대괄호 형태만 잡아서 팔레트 이름으로
    새는 것은 그대로 통과한다.
*/
const TYPE_META: Record<ToastType, { cardClass: string; badgeClass: string; icon: ReactNode }> = {
  success: { cardClass: 'border-pictree-300 bg-pictree-100', badgeClass: 'bg-pictree-700', icon: <LeafIcon /> },
  error: { cardClass: 'border-error/30 bg-error-surface', badgeClass: 'bg-error', icon: <ExclamationIcon /> },
  info: { cardClass: 'border-line bg-cream-sub', badgeClass: 'bg-ink', icon: <InfoIcon /> },
};

/** 등장 방향은 자리를 따른다 — 위에서 오는 것은 내려앉고, 아래에서 오는 것은 떠오른다. */
const enterClass: Record<ToastPlacement, string> = {
  top: 'animate-fade-in-down',
  bottom: 'animate-fade-in-up',
};

// 상단은 헤더/탭 아래로, 하단은 탭바 위로 오도록 위치를 잡는다.
// top 기본값은 **동선 보기 화면** 기준이다. 그 화면 날짜 칩 줄 아래에 맞춘 실측값이고
// (safe + 134.5px 가 칩 바닥, 여기에 여백을 더해 9rem), 예전 값 7rem 은 세이지 밴드
// 시절 기준이라 밴드가 없어진 지금은 칩 위에 겹쳐 앉는다.
//
// ⚠️ **그래서 이 값은 다른 화면에서 근거가 없다.** 로그인 화면이 이 값을 쓰다가
// 토스트가 새싹 일러스트 위에 앉았다 — 그 화면엔 헤더도 칩도 없다.
// 화면마다 여백이 다르므로, 안 맞으면 여기 값을 늘리지 말고 호출부가 `offset` 을 넘긴다
// (PR #20 리뷰에서 "두 번째 top 사용처가 생기면 per-call 로 옮긴다"고 합의한 그 방식).
//
// ⚠️ **하단은 `.bottom-nav` 다 — 고정 px 를 다시 박지 말 것.** 예전 값 `bottom-20`(80px)은
// 탭바(`--nav-height` 86px)보다 낮아 **토스트가 탭바에 6px 파묻혔고, 하단 안전영역이 있는
// 기기에서는 56px 까지 파고들었다.** `.bottom-nav` 는 `--nav-height + --safe-bottom + 16px`
// 이라 탭바 높이가 바뀌어도 따라온다 — 촬영 버튼·FAB·즐겨찾기 액션바가 쓰는 그 유틸이다
// (`styles.css` 가 "두 곳에 같은 숫자를 두면 한쪽만 고쳐진다" 고 경고한 자리인데 토스트만
// 빠져 있었다).
//
// 탭바가 없는 화면(카메라·결제·블로그 작성·로그인)에서는 22px 높이 뜬다. **가리는 것은
// 실패지만 조금 높은 것은 무해**하다는 판단이고, 거슬리는 화면은 위와 같이 `offset` 을 넘긴다.
const placementClass: Record<ToastPlacement, string> = {
  top: 'top-[calc(env(safe-area-inset-top,0px)+9rem)]',
  bottom: 'bottom-nav',
};

/** `offset` 은 모서리에서 **중앙**까지의 거리다 — 토스트 높이를 호출부가 몰라도 되도록. */
const offsetCenterClass: Record<ToastPlacement, string> = {
  top: '-translate-y-1/2',
  bottom: 'translate-y-1/2',
};

/**
 * 토스트는 **앱에서 가장 위**다. 이 값을 내리지 말 것.
 *
 * 토스트는 방금 누른 것이 어떻게 됐는지 알리는 유일한 창구고, 그 알림이 필요한 순간은
 * 대개 무언가가 열려 있을 때다(결제 화면에서 결제가 실패하는 것처럼). 무엇 하나라도 토스트
 * 위에 있으면 **하필 제일 중요한 순간에만 안 보인다.**
 *
 * 종전에 `z-50` 이었고 실제로 그 일이 났다. `<Toaster />` 는 `main.tsx` 에서 `#root` 안에
 * 있는데 시트·모달은 `createPortal` 로 `body` 에 붙는다 — **`#root` 의 형제이면서 DOM 상
 * 뒤에 온다.** z-index 가 같으면 뒤에 온 쪽이 이기므로, 같은 `z-50` 을 든 오버레이는 전부
 * 토스트를 덮었다. `z-[60]` 인 `ModalShell` 은 말할 것도 없다.
 * (`#root` 는 `height:100%` 뿐이라 쌓임 맥락을 만들지 않는다 — 그래서 이 값이 전역으로 먹는다.)
 *
 * 이 앱의 층은 이렇게 쌓인다:
 *   탭바 40 · 전체 화면 오버레이/시트 50 · 모달 60 · **토스트 70**
 */
const TOAST_Z = 'z-[70]';

/**
 * 토스트 한 장. **탭하거나 옆으로 밀어서 없앤다**(#260).
 *
 * ⚠️ **바깥 래퍼와 안쪽 버튼을 가른 것은 겉보기 이유가 아니다.** 등장 연출
 * (`animate-fade-in-*`)은 `animation-fill-mode: both` 라 재생이 끝난 뒤에도 `transform` 을
 * 물고 있고, CSS 애니메이션은 인라인 스타일을 이긴다. 같은 요소에 걸면 드래그가 **DOM 에는
 * 반영되는데 화면에서는 안 움직인다**(TROUBLESHOOTING 2-9, `useSheetDrag` 가 먼저 데인 자리).
 * **래퍼가 등장을, 버튼이 드래그를** 맡아 둘이 서로 다른 요소의 `transform` 을 쓴다.
 *
 * 목록에서 지우는 일은 훅이 아니라 여기가 한다 — 훅은 제스처만 알고 무엇을 지울지는 모른다.
 */
function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { ref, swipeProps } = useSwipeDismiss<HTMLButtonElement>({
    onDismiss,
    onTap: onDismiss, // 밀지 않고 그냥 눌러도 닫힌다(종전 동작 유지)
  });
  const meta = TYPE_META[toast.type];

  return (
    <div className={`w-full ${enterClass[toast.placement]}`}>
      {/*
        토스트 전체가 버튼이다(누르면 닫힘) — 별도 × 를 두면 목표가 34px 안에서 갈라져
        모바일에서 오히려 안 눌린다. 버튼이라 **키보드 Enter/Space 로도 닫힌다** —
        드래그가 안 되는 입력에서는 그게 유일한 길이다.

        `w-full` — **너비는 홈 상단 배너와 같은 규칙이다**(TopBanner 의 inset-x-4
        = 컬럼 − 양쪽 16px). 컨테이너 px-4 가 그 여백을 만든다. 내용 폭으로 두면
        문구 길이마다 폭이 달라져 배너와 다른 물건으로 읽힌다.

        `select-none` — 밀 때 글자가 잡혀 끌리면 제스처가 텍스트 선택으로 새어 나간다.

        모서리·그림자·여백은 앱 관례를 따른다(#105 실측: rounded-xl 60곳 ·
        커스텀 그림자 20곳). 그림자 값은 동선 카드가 쓰는 것을 재사용했다 —
        새 눈대중 값을 만들면 색 때처럼 변형이 자란다.
      */}
      <button
        ref={ref}
        role="status"
        {...swipeProps}
        className={`pointer-events-auto flex w-full select-none items-center gap-2.5 rounded-xl border p-2 pr-4 text-left shadow-[0_6px_18px_rgba(45,51,34,0.10)] ${meta.cardClass}`}
      >
        <span
          aria-hidden
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${meta.badgeClass}`}
        >
          {meta.icon}
        </span>
        {/*
          `whitespace-pre-line` — 문구의 `\n` 을 줄바꿈으로 살린다. 기본값(`normal`)은
          줄바꿈도 공백으로 뭉개서, 문구에 `\n` 을 넣어도 한 줄로 이어 붙었다.
          `pre` 가 아니라 `pre-line` 인 이유: 들여쓴 템플릿 리터럴의 앞쪽 공백까지 그대로
          그리면 문구가 오른쪽으로 밀린다. `pre-line` 은 **줄바꿈만** 살리고 나머지 공백은
          평소처럼 접는다 — 기존 문구는 `\n` 이 없어 전과 똑같이 그려진다.
        */}
        <span className="min-w-0 whitespace-pre-line text-[15px] font-medium leading-5 text-ink">
          {toast.message}
        </span>
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  /*
    자리가 같은 것끼리 한 컨테이너에 쌓는다. `placement` 만으로 묶으면 안 된다 —
    같은 `bottom` 이라도 `offset` 이 다르면 다른 자리이고, 한 컨테이너에 넣으면
    나중 것이 앞의 자리로 끌려간다.
  */
  const groups = new Map<string, ToastItem[]>();
  for (const toast of toasts) {
    const key = `${toast.placement}|${toast.offset ?? ''}`;
    const group = groups.get(key);

    if (group) group.push(toast);
    else groups.set(key, [toast]);
  }

  return (
    <>
      {[...groups].map(([key, items]) => {
        const { placement, offset } = items[0];

        return (
          <div
            key={key}
            style={offset ? { [placement]: offset } : undefined}
            /*
              `mx-auto sm:max-w-[390px]` — 이 컨테이너는 fixed 라 앱 컬럼 밖에 그려진다.
              바텀시트와 같은 규칙으로 묶어야 데스크톱에서 토스트가 컬럼과 정렬된다
              (CLAUDE.md 「폭」). 토스트가 w-full 이 되면서(아래) 이게 없으면 데스크톱에서
              화면 전체 폭으로 늘어난다.
            */
            className={`pointer-events-none fixed inset-x-0 ${TOAST_Z} mx-auto flex flex-col items-center gap-2 px-4 sm:max-w-[390px] ${
              offset ? offsetCenterClass[placement] : placementClass[placement]
            }`}
          >
            {items.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
          </div>
        );
      })}
    </>
  );
}
