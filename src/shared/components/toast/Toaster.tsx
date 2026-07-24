import { useToastStore, ToastType, ToastPlacement } from './toastStore';

/** 토스트 렌더러. 앱 최상단에 한 번만 <Toaster /> 로 마운트. */

const typeClass: Record<ToastType, string> = {
  success: 'bg-pictree-700 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-neutral-800 text-white',
};

// 상단은 헤더/탭 아래로, 하단은 탭바 위로 오도록 위치를 잡는다.
// top 은 현재 동선 보기 화면만 쓰며, 값은 그 화면 세이지 밴드 높이(safe + 112px)에
// 맞춘 것이다. 헤더 높이가 다른 화면이 top 을 쓰게 되면 페이지가 오프셋을 넘기는
// 방식으로 바꿔야 한다.
//
// TODO(PR #20 리뷰 합의): 두 번째 top 사용처가 생기거나 레이아웃 정리 작업을 할 때
//   showToast(message, type, { placement: 'top', offsetTop }) 처럼 호출부가 오프셋을
//   넘기고, 여기서는 기본값만 두는 per-call 방식으로 옮긴다.
//   지금은 사용처가 하나뿐이라 이대로 두는 것으로 합의됐다.
const placementClass: Record<ToastPlacement, string> = {
  top: 'top-[calc(env(safe-area-inset-top,0px)+7rem+5px)]',
  bottom: 'bottom-20',
};

const PLACEMENTS: ToastPlacement[] = ['top', 'bottom'];

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
            className={`pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 ${placementClass[placement]}`}
          >
            {items.map((toast) => (
              <button
                key={toast.id}
                onClick={() => removeToast(toast.id)} // 클릭 시 즉시 닫기
                className={`pointer-events-auto max-w-sm rounded-md px-4 py-2 text-sm shadow-lg ${typeClass[toast.type]}`}
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
