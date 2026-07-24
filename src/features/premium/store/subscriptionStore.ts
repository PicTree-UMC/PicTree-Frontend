import { create } from 'zustand';
import type { SubscriptionPlan } from '../types/premium';

type SubscriptionState = {
  isPremium: boolean;
  activePlan: SubscriptionPlan | null;
  activate: (plan: SubscriptionPlan) => void;
  cancel: () => void;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  activePlan: null,
  activate: (activePlan) => set({ isPremium: true, activePlan }),
  cancel: () => set({ isPremium: false, activePlan: null }),
}));
