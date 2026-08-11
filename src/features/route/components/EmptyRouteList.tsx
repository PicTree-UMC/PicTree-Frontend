import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';

import { RouteIllustration } from './RouteIllustration';

/**
 * 저장한 동선이 하나도 없을 때.
 *
 * ⚠️ **`RouteListPage` 안에 인라인으로 있던 것을 빼냈다**(이슈 #274). 셋 중 이 화면만
 * 별도 컴포넌트가 아니어서, 값이 어긋나 있어도 나란히 놓고 비교할 수가 없었다 —
 * CTA 글자색이 여기만 `text-white` 였던 것도 그래서 오래 남았다.
 *
 * 얼개·간격·CTA 색은 공용 `EmptyState` 가 갖는다. 여기서 정하는 것은 **경로 그림과
 * 그 그림이 끝나는 시점**뿐이다.
 */
export function EmptyRouteList() {
  const navigate = useNavigate();

  return (
    <EmptyState
      /*
        그림 안 요소가 스스로 순서대로 살아난다(약 1.3초). 그래서 글이 늦게 뜬다 —
        그림보다 먼저 뜨면 이야기 순서가 꼬인다.
      */
      illustration={<RouteIllustration className="w-[200px]" />}
      title="아직 저장된 동선이 없어요"
      description={
        <>
          여행하며 다녀온 장소들을 이어
          <br />
          나만의 여행 발자국을 남겨보세요.
        </>
      }
      revealDelay={600}
      action={{
        label: '동선 생성하기',
        onClick: () => navigate(ROUTES.journeyCreate),
      }}
    />
  );
}
