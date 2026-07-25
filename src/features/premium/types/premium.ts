export type SubscriptionPlan = 'plus' | 'pro' | 'max';
export type PaymentStep = 'plan' | 'confirm' | 'complete';

export type PlanDetails = {
  name: string;
  storage: string;
  generations: string;
  price: string;
  description: string;
};

export const PLAN_DETAILS: Record<SubscriptionPlan, PlanDetails> = {
  plus: {
    name: '플러스',
    storage: '1GB',
    generations: '월 5회',
    price: '4,900원',
    description: '가볍게 여행을 기록하는 사용자',
  },
  pro: {
    name: '프로',
    storage: '5GB',
    generations: '월 20회',
    price: '6,900원',
    description: '사진과 블로그를 자주 남기는 사용자',
  },
  max: {
    name: '맥스',
    storage: '20GB',
    generations: '월 50회',
    price: '12,900원',
    description: '여행 기록을 콘텐츠로 운영하는 사용자',
  },
};
