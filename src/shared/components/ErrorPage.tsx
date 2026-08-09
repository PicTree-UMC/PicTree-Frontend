import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from './Button';

type ErrorViewProps = {
  heading: string;
  detail: string;
  actionLabel?: string;
  onAction: () => void;
};

/**
 * 에러 화면의 **보이는 부분**. 라우터를 전혀 모른다.
 *
 * ⚠️ **갈라 둔 이유가 있다.** 루트 `ErrorBoundary` 는 `RouterProvider` 바깥에 서므로
 * `useRouteError`·`useNavigate` 를 쓸 수 없다 — 그 훅들은 데이터 라우터 컨텍스트가
 * 없으면 invariant 로 **던진다**(`useRouteError` → `useDataRouterState`).
 * 폴백이 스스로 터지면 고치려던 백지가 그대로 남는다.
 *
 * 그래서 라우터를 아는 `ErrorPage` 는 `errorElement` 가 쓰고, 루트 바운더리는 이걸 쓴다.
 */
export function ErrorView({ heading, detail, actionLabel = '홈으로 돌아가기', onAction }: ErrorViewProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl" aria-hidden>
        ⚠️
      </div>
      <div>
        <h1 className="text-lg font-medium text-neutral-900">{heading}</h1>
        <p className="mt-1 text-[15px] text-neutral-500">{detail}</p>
      </div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}

/** 공용 에러 화면. 라우터 errorElement 로 등록하거나 라우터 안에서 직접 렌더해서 쓴다. */
type ErrorPageProps = {
  title?: string;
  description?: string;
  onReset?: () => void; // 버튼 동작 (기본: 홈 이동)
};

export function ErrorPage({ title, description, onReset }: ErrorPageProps) {
  const navigate = useNavigate();
  const routeError = useRouteError(); // errorElement 로 쓰였을 때 실제 에러

  // 여기서 따로 로그를 남기지 않는다 — react-router 가 이미
  // "React Router caught the following error during render" 로 남긴다.
  // 개발 전용이 아니라 **프로덕션 번들에도 들어 있는** 로그다(dist 에서 확인).

  let heading = title ?? '문제가 발생했어요';
  let detail = description ?? '잠시 후 다시 시도해주세요.';

  // props 로 안 넘겼고 라우터 HTTP 에러(예: 404)면 상태코드 반영
  if (!title && isRouteErrorResponse(routeError)) {
    heading = `${routeError.status} 오류`;
    detail = routeError.statusText || detail;
  }

  return (
    <ErrorView
      heading={heading}
      detail={detail}
      onAction={() => (onReset ? onReset() : navigate('/'))}
    />
  );
}
