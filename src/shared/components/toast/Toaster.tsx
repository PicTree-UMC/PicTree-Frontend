import { useToastStore, ToastType, ToastPlacement } from './toastStore';

/** 토스트 렌더러. 앱 최상단에 한 번만 <Toaster /> 로 마운트. */

const typeClass: Record<ToastType, string> = {
  success: 'bg-pictree-700 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-neutral-800 text-white',
};

// 상단은 헤더/탭 아래로, 하단은 탭바 위로 오도록 위치를 잡는다.
// top 은 현재 동선 보기 화면만 쓴다. 값은 그 화면 **날짜 칩 줄 아래**에 맞춘 것이다
// (실측: safe + 134.5px 가 칩 바닥, 여기에 여백을 더해 9rem). 예전 값 7rem 은 세이지
// 밴드 시절 기준이라, 밴드가 없어지고 날짜 칩이 생긴 지금은 칩 위에 겹쳐 앉는다.
// 헤더 높이가 다른 화면이 top 을 쓰게 되면 페이지가 오프셋을 넘기는 방식으로 바꿔야 한다.
//
// TODO(PR #20 리뷰 합의): 두 번째 top 사용처가 생기거나 레이아웃 정리 작업을 할 때
//   showToast(message, type, { placement: 'top', offsetTop }) 처럼 호출부가 오프셋을
//   넘기고, 여기서는 기본값만 두는 per-call 방식으로 옮긴다.
//   지금은 사용처가 하나뿐이라 이대로 두는 것으로 합의됐다.
const placementClass: Record<ToastPlacement, string> = {
  top: 'top-[calc(env(safe-area-inset-top,0px)+9rem)]',
  bottom: 'bottom-20',
};

const PLACEMENTS: ToastPlacement[] = ['top', 'bottom'];

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

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      {PLACEMENTS.map((placement) => {
        const items = toasts.filter((t) => t.placement === placement);
        if (items.length === 0) return null;

        return (
          <div
            key={placement}
            className={`pointer-events-none fixed inset-x-0 ${TOAST_Z} flex flex-col items-center gap-2 px-4 ${placementClass[placement]}`}
          >
            {items.map((toast) => (
              <button
                key={toast.id}
                onClick={() => removeToast(toast.id)} // 클릭 시 즉시 닫기
                className={`pointer-events-auto max-w-sm rounded-md px-4 py-2 text-[15px] shadow-lg ${typeClass[toast.type]}`}
              >
                {toast.message}
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}
