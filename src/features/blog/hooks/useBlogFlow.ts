import { useEffect, useState } from 'react';
import type { BlogStatus } from '../types/blog';
import { useSubscriptionStore } from '../../premium/store/subscriptionStore';

const MOCK_GENERATION_DELAY = 1800;

export function useBlogFlow() {
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('free');
  const isPremium = useSubscriptionStore((state) => state.isPremium);

  useEffect(() => {
    if (blogStatus !== 'generating') return;
    const timer = window.setTimeout(() => setBlogStatus('draft'), MOCK_GENERATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [blogStatus]);

  return {
    blogStatus,
    isPremium,
    generateDraft: () => setBlogStatus('generating'),
  };
}
