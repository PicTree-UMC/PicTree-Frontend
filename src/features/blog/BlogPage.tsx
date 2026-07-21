import { useNavigate } from 'react-router-dom';
import { BlogComposer } from './components/BlogComposer';
import { BlogHeader } from './components/BlogHeader';
import { useBlogFlow } from './hooks/useBlogFlow';
import { ROUTES } from '../../shared/constants/routes';

export function BlogPage() {
  const flow = useBlogFlow();
  const navigate = useNavigate();
  const openPremium = () => navigate(ROUTES.premium);

  return (
    <main className="min-h-full w-full bg-[#fffdf4] text-[#20251f]">
      <BlogHeader isPremium={flow.isPremium} onUpgrade={openPremium} />
      <BlogComposer
        status={flow.blogStatus}
        isPremium={flow.isPremium}
        onCreate={flow.isPremium ? flow.generateDraft : openPremium}
      />
    </main>
  );
}
