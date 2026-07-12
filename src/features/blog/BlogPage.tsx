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
    <main className="mx-auto min-h-screen max-w-[390px] bg-[#fffdf4] pb-28 text-[#20251f] shadow-sm">
      <BlogHeader isPremium={flow.isPremium} onUpgrade={openPremium} />
      <BlogComposer
        status={flow.blogStatus}
        onCreate={flow.isPremium ? flow.generateDraft : openPremium}
      />
    </main>
  );
}
