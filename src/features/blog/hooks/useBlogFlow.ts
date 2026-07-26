import { useEffect, useMemo, useState } from 'react';
import type { BlogStatus } from '../types/blog';
import { useSubscriptionStore } from '../../premium/store/subscriptionStore';
import { MOCK_BLOG_TREES } from '../mocks/blogTrees';
import { getLocalDateString } from '../../../shared/lib/date';

const MOCK_GENERATION_DELAY = 1800;

export function useBlogFlow() {
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('free');
  const [startDate, setStartDate] = useState('2026-03-31');
  const [endDate, setEndDate] = useState('2026-04-01');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const activePlan = useSubscriptionStore((state) => state.activePlan);
  const trees = useMemo(
    () => MOCK_BLOG_TREES.filter((tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      return date >= startDate && date <= endDate;
    }),
    [startDate, endDate],
  );
  const activityByDate = useMemo(
    () => MOCK_BLOG_TREES.reduce<Record<string, number>>((activity, tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      activity[date] = (activity[date] ?? 0) + 1;
      return activity;
    }, {}),
    [],
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
    savedAt,
    trees,
    activityByDate,
    setDateRange: (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      setBlogStatus(isPremium ? 'premium' : 'free');
    },
    generateDraft: () => setBlogStatus('generating'),
    saveDraft: () => {
      setSavedAt(getLocalDateString());
      setBlogStatus('saved');
    },
    deleteDraft: () => {
      setSavedAt(null);
      setBlogStatus('premium');
    },
  };
}
