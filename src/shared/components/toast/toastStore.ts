import { create } from 'zustand';

/**
 * 토스트(짧은 알림) 전역 상태 - zustand.
 * 데이터만 관리하고, 화면 표시는 Toaster.tsx 담당.
 * 사용: const { showToast } = useToast(); showToast('저장됨', 'success');
 */

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 2500) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    window.setTimeout(() => get().removeToast(id), duration); // duration 뒤 자동 제거
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** 컴포넌트에서 알림을 띄울 때 쓰는 간편 훅. */
export const useToast = () => {
  const addToast = useToastStore((s) => s.addToast);
  return { showToast: addToast };
};
