import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PrimaryCta } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';
import { useBlogDraftUsage } from '@/features/blog/hooks/useBlogDraftUsage';
import { useMySubscription } from '@/features/premium/hooks/useMySubscription';
import { PREMIUM_GRADIENT_CLASS } from '@/features/premium/lib/backdrop';

/** ③단계에서 실어 보내는 이름. 없어도 화면은 선다(새로고침·딥링크). */
type RouteSavedState = { routeName?: string } | null | undefined;

/**
 * 새 동선 만들기 ④단계 — 저장 직후.
 *
 * 종전엔 토스트 한 줄을 띄우고 동선 탭으로 튕겨 보냈다. 저장 직후는 "이 여행으로 뭘 더 할까"가
 * 가장 잘 먹히는 자리인데 그 순간이 토스트로 스쳐 지나갔다. 여기서 **방금 저장한 동선을 AI 블로그
 * 초안의 입력으로** 바로 이어 준다 — 작성 화면 1단계가 이미 정해진 셈이 된다(이슈 #212).
 *
 * **뒤로가기 헤더가 없다.** 저장은 끝났고 되돌릴 것이 없다(`BillingSuccessPage` 와 같다).
 * 나가는 길은 아래 둘뿐이고, 둘 다 이 화면을 스택에서 지우고 나간다.
 */
export function RouteSavedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { routeId: routeIdParam } = useParams();
  const routeId = Number(routeIdParam);

  const { data: subscription, isPending: isSubscriptionPending } = useMySubscription();
  const { data: usage, isPending: isUsagePending } = useBlogDraftUsage();

  const routeName = (location.state as RouteSavedState)?.routeName;

  /*
    잔량을 **모르는 것과 0 인 것은 다르다.** 사용량 조회가 실패하면 `usage` 가 없는데, 그걸
    소진으로 읽으면 멀쩡한 구독자를 결제 화면으로 보낸다. 모를 때는 열어 두고 판정은 서버에
    맡긴다 — `useBlogDraftUsage` 주석이 잡아 둔 태도와 같다.
  */
  const isOutOfDrafts = usage !== undefined && usage.remainingCount === 0;
  const needsUpgrade = !isSubscriptionPending && (!subscription || isOutOfDrafts);
  const isGateLoading = isSubscriptionPending || isUsagePending;

  // 주소를 손으로 치거나 옛 링크를 눌렀을 때. 무엇을 저장했는지 모르는 화면을 세울 수 없다.
  if (!Number.isFinite(routeId)) {
    return <Navigate to={ROUTES.journey} replace />;
  }

  /*
    ⚠️ `replace` — 소진된 성공 화면을 스택에서 지운다. 작성 화면 1단계의 뒤로가기는 이미
    `ROUTES.blog` 로 가게 되어 있어(`BlogCreatePage`), 거기서 뒤로 가면 블로그 메인이 된다.
    프리필은 동선 id 하나다 — 기간도 treeIds 도 작성 화면이 동선 상세에서 도로 뽑는다.
  */
  const goToBlogCreate = () =>
    navigate(ROUTES.blogCreate, { replace: true, state: { routeId } });

  /*
    ⚠️ 여기만 push 다. `/premium` 은 곁길이라 보고 나서 뒤로 오면 이 화면이 그대로 있어야
    `동선 목록으로 가기` 를 다시 고를 수 있다.
  */
  const goToPremium = () => navigate(ROUTES.premium);

  /*
    id 를 실어 보내야 동선 탭이 방금 만든 걸 고른다 — 목록 순서는 서버가 정하는 거라
    '첫 번째가 최신' 이라고 기대할 수 없다.
  */
  const goToRouteList = () =>
    navigate(ROUTES.journey, { replace: true, state: { selectedRouteId: routeId } });

  return (
    <main className="flex min-h-full w-full flex-col items-center justify-center px-5 text-center">
      <p className="text-xl font-medium text-[#2c3930]">동선을 저장했어요</p>

      {/* 이름이 없으면 줄째로 뺀다 — 빈 줄은 이름을 못 받은 게 아니라 이름이 없는 것처럼 읽힌다. */}
      {routeName && (
        <p className="mt-2 max-w-full truncate text-[15px] text-[#60655c]">{routeName}</p>
      )}

      <p className="mt-6 text-[15px] leading-[22px] text-[#2c3930]">
        이 동선으로 블로그 초안을
        <br />
        바로 만들어 볼 수 있어요
      </p>

      <div className="mt-6 w-full">
        {needsUpgrade ? (
          /*
            ⚠️ `PrimaryCta` 에 className 으로 얹지 않는다 — 그 컴포넌트 주석대로 배경·라운드가
            서로 이기려 들어 결과가 CSS 파일 순서에 달린다. 치수만 같게 맞춘 별도 버튼이다.

            ⚠️ 글자가 흰색이 아니라 INK 인 이유: 이 그라데이션은 L* 84 → 96.5 로 밝다.
            흰 글자는 위 끝에서 1.4:1 로 무너진다(`backdrop.ts` 가 INK 대비를 7.9:1 이상으로
            못박아 뒀다).
          */
          <button
            type="button"
            onClick={goToPremium}
            className={`h-[52px] w-full rounded-[24px] text-[15px] font-medium text-[#2c3930] ${PREMIUM_GRADIENT_CLASS}`}
          >
            {/* 미구독과 한도 소진은 다음에 할 일이 같아도 사유가 다르다. 사유를 안 밝히면
                이미 결제한 사람이 결제 화면으로 다시 불려 온 것으로 읽힌다. */}
            {isOutOfDrafts ? '이번 주기 초안을 다 썼어요' : '프리미엄으로 초안 만들기'}
          </button>
        ) : (
          <PrimaryCta onClick={goToBlogCreate} disabled={isGateLoading}>
            블로그 초안 만들기
          </PrimaryCta>
        )}

        <button
          type="button"
          onClick={goToRouteList}
          className="mt-3 w-full py-2 text-[13px] text-[#60655c]"
        >
          동선 목록으로 가기
        </button>
      </div>
    </main>
  );
}
