import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogComposer } from './components/BlogComposer';
import { BlogHeader } from './components/BlogHeader';
import { useBlogFlow } from './hooks/useBlogFlow';
import { ROUTES } from '../../shared/constants/routes';
import { PremiumUpsellSheet } from './components/PremiumUpsellSheet';

export function BlogPage() {
  const flow = useBlogFlow();
  const navigate = useNavigate();
  const [upsellOpen, setUpsellOpen] = useState(false);
  const openPremium = () => navigate(ROUTES.premium);

  return (
    <main className="min-h-full w-full bg-[#fffdf4] text-[#20251f]">
      <BlogHeader isPremium={flow.isPremium} onUpgrade={openPremium} />
      <BlogComposer
        status={flow.blogStatus}
        isPremium={flow.isPremium}
        onCreate={flow.isPremium ? flow.generateDraft : () => setUpsellOpen(true)}
      />
      {upsellOpen && (
        <PremiumUpsellSheet
          onClose={() => setUpsellOpen(false)}
          onUpgrade={openPremium}
        />
      )}
    </main>
  );
}
