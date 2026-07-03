import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from './Button';

/** 공용 에러 화면. 라우터 errorElement 로 등록하거나 직접 렌더해서 사용. */
type ErrorPageProps = {
  title?: string;
  description?: string;
  onReset?: () => void; // 버튼 동작 (기본: 홈 이동)
};

export function ErrorPage({ title, description, onReset }: ErrorPageProps) {
  const navigate = useNavigate();
  const routeError = useRouteError(); // errorElement 로 쓰였을 때 실제 에러

  let heading = title ?? '문제가 발생했어요';
  let detail = description ?? '잠시 후 다시 시도해주세요.';

  // props 로 안 넘겼고 라우터 HTTP 에러(예: 404)면 상태코드 반영
  if (!title && isRouteErrorResponse(routeError)) {
    heading = `${routeError.status} 오류`;
    detail = routeError.statusText || detail;
  }

  const handleReset = () => (onReset ? onReset() : navigate('/'));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl" aria-hidden>
        ⚠️
      </div>
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{heading}</h1>
        <p className="mt-1 text-sm text-neutral-500">{detail}</p>
      </div>
      <Button onClick={handleReset}>홈으로 돌아가기</Button>
    </div>
  );
}
