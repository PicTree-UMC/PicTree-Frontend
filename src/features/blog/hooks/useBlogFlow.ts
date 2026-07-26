import { useEffect, useMemo, useState } from 'react';
import type { BlogStatus } from '../types/blog';
import { useSubscriptionStore } from '../../premium/store/subscriptionStore';
import { MOCK_BLOG_TREES } from '../mocks/blogTrees';

const MOCK_GENERATION_DELAY = 1800;

export function useBlogFlow() {
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('free');
  const [startDate, setStartDate] = useState('2026-03-31');
  const [endDate, setEndDate] = useState('2026-04-01');
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const activePlan = useSubscriptionStore((state) => state.activePlan);
  const trees = useMemo(
    () => MOCK_BLOG_TREES.filter((tree) => {
      const date = tree.createdAt.slice(0, 10);
      return date >= startDate && date <= endDate;
    }),
    [startDate, endDate],
  );

  useEffect(() => {
    if (blogStatus !== 'generating') return;
    const timer = window.setTimeout(() => setBlogStatus('draft'), MOCK_GENERATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [blogStatus]);

  return {
    blogStatus,
    isPremium,
    activePlan,
    startDate,
    endDate,
    trees,
    setStartDate: (date: string) => {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
      setBlogStatus(isPremium ? 'premium' : 'free');
    },
    setEndDate: (date: string) => {
      setEndDate(date);
      if (date < startDate) setStartDate(date);
      setBlogStatus(isPremium ? 'premium' : 'free');
    },
    generateDraft: () => setBlogStatus('generating'),
    saveDraft: () => setBlogStatus('saved'),
    deleteDraft: () => setBlogStatus('premium'),
  };
}
