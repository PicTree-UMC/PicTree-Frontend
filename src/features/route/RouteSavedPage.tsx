import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PrimaryCta } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';
import { RouteIllustration } from './components/RouteIllustration';
import { useBlogDraftUsage } from '@/features/blog/hooks/useBlogDraftUsage';
import { PREMIUM_GRADIENT_CLASS } from '@/features/premium/lib/backdrop';
import { PICTREE_TOKEN_LABEL } from '@/features/premium/lib/planDisplay';

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

  const { data: usage, isPending: isUsagePending } = useBlogDraftUsage();

  const routeName = (location.state as RouteSavedState)?.routeName;

  /*
    ⚠️ **구독 여부는 보지 않는다.** 한때 `!subscription` 도 업그레이드 사유로 쳤는데 틀렸다 —
    무료 플랜도 PICTREE 토큰을 월 1개 받는다(`/premium` 비교표에 그렇게 적혀 있고, 서버
    `BLOG_DRAFT_LIMIT` 도 FREE 1 이다). 구독이 없다는 게 초안을 못 만든다는 뜻이 아니므로,
    막을 사유는 **잔량이 0 인 것** 하나뿐이다.

    잔량을 **모르는 것과 0 인 것은 다르다.** 사용량 조회가 실패하면 `usage` 가 없는데, 그걸
    소진으로 읽으면 아직 쓸 수 있는 사람을 결제 화면으로 보낸다. 모를 때는 열어 두고 판정은
    서버에 맡긴다 — `useBlogDraftUsage` 주석이 잡아 둔 태도와 같다.
  */
  const isOutOfDrafts = usage !== undefined && usage.remainingCount === 0;

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
    /*
      `h-full` 이다 — **`min-h-full` 이었다.** 내용이 문장 세 줄뿐이라 눈에 띄지 않았지만,
      높이가 안 확정된 컬럼에서는 아래 버튼이 '바닥' 이 아니라 '흐름의 끝' 에 있는 것이라
      내용이 화면보다 길어지면 밀려난다(블로그 만들기 세 단계가 그래서 터졌다).
      ①②③ 과 같은 얼개로 맞춰 둔다.
    */
    <main className="flex h-full w-full flex-col">
      {/* 알림은 남는 자리 한가운데. 아래 버튼이 자리를 먼저 가져가고 남는 만큼을 쓴다.
          `min-h-0` + `overflow-y-auto`: 큰 글꼴·가로 모드처럼 자리가 모자랄 때 이 칸이
          스크롤을 받는다. 없으면 높이가 확정된 만큼 넘치는 부분이 잘려 안 보인다. */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 text-center">
        {/*
          동선이 그려지는 그림이 먼저 돈다(약 1.3초). 빈 화면에서는 앞으로 만들 것을 예고하는
          그림인데, 여기서는 **방금 만든 그것**이라 같은 그림이 확인이 된다.

          문구는 그림이 끝날 즈음 떠오른다 — 먼저 뜨면 "다 됐다"를 글이 말해 버려서 그림이
          뒷북이 된다(`RouteListPage` 빈 화면과 같은 지연값).
        */}
        <RouteIllustration className="w-[200px]" />

        <p
          className="animate-fade-in-up mt-6 text-xl font-medium text-ink"
          style={{ animationDelay: '600ms' }}
        >
          동선을 저장했어요
        </p>

        {/* 이름이 없으면 줄째로 뺀다 — 빈 줄은 이름을 못 받은 게 아니라 이름이 없는 것처럼 읽힌다. */}
        {routeName && (
          <p
            className="animate-fade-in-up mt-2 max-w-full truncate text-[15px] text-ink-muted"
            style={{ animationDelay: '600ms' }}
          >
            {routeName}
          </p>
        )}

        {/*
          ⚠️ **이 줄은 상태를 따라간다.** 초안을 못 만드는 사람에게 "바로 만들어 볼 수 있어요"
          는 그냥 틀린 말이고, 그 상태를 버튼 글자에 밀어 넣으면 이번엔 버튼이 눌렀을 때 무슨
          일이 나는지를 말하지 못한다(`이번 주기 초안을 다 썼어요` 는 상태지 동작이 아니다).
          **사유는 문장이 말하고 버튼은 다음 수를 말한다.**
        */}
        <p
          className="animate-fade-in-up mt-6 text-[15px] leading-[22px] text-ink"
          style={{ animationDelay: '750ms' }}
        >
          {isOutOfDrafts ? (
            /*
              다음 주기에 채워진다는 걸 숨기지 않는다 — 업그레이드만 말하면 기다리면 되는
              사람에게 결제가 유일한 길인 것처럼 읽힌다. `지금` 이 그 차이를 진다.
            */
            <>
              이번 주기 {PICTREE_TOKEN_LABEL}을 다 썼어요
              <br />
              플랜을 올리면 지금 더 쓸 수 있어요
            </>
          ) : (
            <>
              이 동선으로 블로그 초안을
              <br />
              바로 만들어 볼 수 있어요
            </>
          )}
        </p>
      </div>

      {/*
        버튼은 바닥에 앉힌다 — ①②③ 단계가 전부 하단 CTA 라, 흐름의 꼬리인 이 화면만 버튼이
        가운데 떠 있으면 방금까지 손가락이 있던 자리가 아니다. 여백은 그 화면들과 같은 값.

        구분선(`border-t`)은 두지 않는다 — 위가 스크롤되는 내용이 아니라 문장 세 줄이라,
        선을 그으면 나눌 것이 없는 화면을 둘로 가른다.

        ⚠️ **버튼에는 등장 지연을 걸지 않는다.** 위 문구는 순서대로 떠오르지만 버튼까지
        그 줄에 세우면 저장을 막 끝낸 사람이 1초 가까이 아무것도 못 누른다. 이 화면의 목적이
        그 버튼이라, 연출이 그걸 늦추면 순서가 뒤집힌 것이다. 바닥에 떨어져 있어 위 문구와
        같이 움직이지 않아도 어긋나 보이지 않는다.
      */}
      <div className="px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        {isOutOfDrafts ? (
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
            className={`h-[52px] w-full rounded-[24px] text-[15px] font-medium text-ink ${PREMIUM_GRADIENT_CLASS}`}
          >
            플랜 업그레이드
          </button>
        ) : (
          <PrimaryCta onClick={goToBlogCreate} disabled={isUsagePending}>
            블로그 초안 만들기
          </PrimaryCta>
        )}

        <button
          type="button"
          onClick={goToRouteList}
          className="mt-3 w-full py-2 text-[13px] text-ink-muted"
        >
          동선 목록으로 가기
        </button>
      </div>
    </main>
  );
}
