import { create } from 'zustand';

/**
 * 토스트(짧은 알림) 전역 상태 - zustand.
 * 데이터만 관리하고, 화면 표시는 Toaster.tsx 담당.
 * 사용: const { showToast } = useToast(); showToast('저장됨', 'success');
 * 상단 노출: showToast('저장됨', 'success', { placement: 'top' });
 * 줄바꿈: 문구에 `\n` 을 넣는다 — `Toaster` 가 `whitespace-pre-line` 으로 살린다.
 *
 * ⚠️ 문구는 **문자열**이다(ReactNode 가 아니다). `<br />` 이나 굵은 글씨를 넣을 수 없고,
 * 넣을 자리도 아니다 — 토스트는 한두 줄짜리 알림이다. 서식이 필요하면 모달·시트를 쓴다.
 */

export type ToastType = 'success' | 'error' | 'info';
export type ToastPlacement = 'top' | 'bottom';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  placement: ToastPlacement;
  offset?: string;
}

interface ToastOptions {
  duration?: number;
  placement?: ToastPlacement; // 기본 하단. 화면에 따라 상단으로 띄우고 싶을 때 'top'.
  /**
   * 기준 모서리(`placement`)에서 토스트 **중앙**까지의 거리. CSS 길이면 뭐든 된다.
   *
   * 기본 위치는 탭바·헤더가 있는 화면에 맞춰 둔 값이라, 그 둘이 없는 화면(로그인 등)에서는
   * 엉뚱한 데 앉는다. **그 화면의 여백을 아는 건 그 화면이므로** 값을 여기서 늘리지 말고
   * 호출부가 넘긴다 (Toaster 의 TODO 에 적힌 합의).
   */
  offset?: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', options = {}) => {
    const { duration = 2500, placement = 'bottom', offset } = options;
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type, placement, offset }] }));
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
