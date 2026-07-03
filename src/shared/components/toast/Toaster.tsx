import { useToastStore, ToastType } from './toastStore';

/** 토스트 렌더러. 앱 최상단에 한 번만 <Toaster /> 로 마운트. */

const typeClass: Record<ToastType, string> = {
  success: 'bg-pictree-700 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-neutral-800 text-white',
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
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
}
