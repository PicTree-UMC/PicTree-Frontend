import { create } from 'zustand';

/**
 * 토스트(짧은 알림) 전역 상태 - zustand.
 * 데이터만 관리하고, 화면 표시는 Toaster.tsx 담당.
 * 사용: const { showToast } = useToast(); showToast('저장됨', 'success');
 * 상단 노출: showToast('저장됨', 'success', { placement: 'top' });
 */

export type ToastType = 'success' | 'error' | 'info';
export type ToastPlacement = 'top' | 'bottom';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  placement: ToastPlacement;
}

interface ToastOptions {
  duration?: number;
  placement?: ToastPlacement; // 기본 하단. 화면에 따라 상단으로 띄우고 싶을 때 'top'.
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', options = {}) => {
    const { duration = 2500, placement = 'bottom' } = options;
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type, placement }] }));
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
