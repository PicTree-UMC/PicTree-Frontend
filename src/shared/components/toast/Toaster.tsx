import { useToastStore, ToastType, ToastPlacement } from './toastStore';

/** 토스트 렌더러. 앱 최상단에 한 번만 <Toaster /> 로 마운트. */

const typeClass: Record<ToastType, string> = {
  success: 'bg-pictree-700 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-neutral-800 text-white',
};

// 상단은 헤더/탭 아래로, 하단은 탭바 위로 오도록 위치를 잡는다.
const placementClass: Record<ToastPlacement, string> = {
  top: 'top-24',
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
