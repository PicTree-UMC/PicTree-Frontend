import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

/**
 * 토스 빌링 인증 실패/취소 시 착지하는 페이지.
 * 토스가 쿼리스트링에 붙여준 에러 code·message 를 보여준다.
 */
export function BillingFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');

  return (
    <main className="flex min-h-full w-full flex-col items-center justify-center gap-4 px-5 text-center text-[#2c3930]">
      <p className="text-[15px]">결제가 완료되지 않았어요.</p>
      {message && <p className="text-[13px] text-[#60655c]">{message}</p>}
      <button
        className="h-[45px] rounded-xl bg-[#788f4a] px-6 font-bold text-white"
        onClick={() => navigate(ROUTES.premium, { replace: true })}
      >
        돌아가기
      </button>
    </main>
  );
}
