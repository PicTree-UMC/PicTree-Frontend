import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { PencilIcon } from './icons';
import { useBlogDraftUsage } from '../hooks/useBlogDraftUsage';
import { PremiumUpsellSheet } from './PremiumUpsellSheet';

interface BlogCreateFabProps {
  /**
   * 이 동선으로 초안을 시작한다(작성 화면이 navigate state 로 받는다). 넘기면 1단계
   * (동선 고르기)가 이미 정해진 셈이 된다 — 초안의 입력 단위가 기간에서 동선으로
   * 바뀌면서 생긴 길이다(이슈 #212). 안 넘기면 작성 화면에서 고른다.
   */
  routeId?: number;
  /**
   * 곁들일 글자. 주면 원이 아니라 알약(확장 FAB)이 된다.
   *
   * 블로그 탭에서는 화면 전체가 블로그 이야기라 연필 하나로 읽히지만, 동선 탭처럼
   * **다른 것을 만들 수도 있는 화면**에서는 초록 원이 무엇을 쓰는 버튼인지 말해 주지
   * 않는다(그 화면에는 '새 동선' 입구가 이미 따로 있다).
   */
  label?: string;
}

/**
 * 작성 진입 플로팅 버튼. 하단 탭바 위 우하단에 고정.
 * 띄우는 높이는 `bottom-nav` 유틸에 맡긴다 — 탭바 높이 + 하단 안전영역을
 * 한곳에서 계산하므로 여기서 px 를 따로 들고 있을 필요가 없다.
 * 모달 정렬 관례대로 390px 컬럼에 맞춰 띄우고, 래퍼는 클릭을 통과시킨다.
 *
 * **블로그 탭과 동선 탭이 같이 쓴다.** 동선 탭에서는 메뉴 시트의 `AI 블로그 작성` 줄이
 * 이 버튼으로 나왔다 — 메뉴 안에 있는 동안에는 이 앱이 블로그를 써 준다는 것 자체가
 * 접혀 있었다. 컴포넌트를 나누지 않은 이유는 **이 버튼이 이달 잔량을 보고 길을 가르기
 * 때문**이다(아래 `handleCreate`). 복사해 두면 한쪽만 한도를 안 보게 된다.
 */
export function BlogCreateFab({ routeId, label }: BlogCreateFabProps = {}) {
  const navigate = useNavigate();
  const { data: usage, isPending } = useBlogDraftUsage();
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);

  const handleCreate = () => {
    if (isPending) return;
    /*
      ⚠️ 잔량을 **모르는 것과 0 인 것은 다르다.** 조회가 실패하면 `usage` 가 없는데, 그걸
      소진으로 읽으면 아직 쓸 수 있는 사람 앞에 결제 시트를 세운다. 모를 때는 들여보내고
      판정은 서버에 맡긴다 — 종전엔 여기서 토스트로 길을 막았지만, 막아 봐야 사용자가
      할 수 있는 일이 없고 정작 쓸 수 있는 사람만 못 들어간다.
    */
    if (usage?.remainingCount === 0) {
      setShowPremiumSheet(true);
      return;
    }
    navigate(ROUTES.blogCreate, routeId === undefined ? undefined : { state: { routeId } });
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto sm:max-w-[390px]">
        <button
          type="button"
          // 글자가 보이면 그것이 이름이다 — 둘 다 주면 낭독기가 aria-label 만 읽어 화면과 갈린다.
          aria-label={label ? undefined : '블로그 작성하기'}
          className={`bottom-nav pointer-events-auto absolute right-5 flex h-14 items-center justify-center rounded-full bg-pictree-700 text-white shadow-[0_10px_22px_rgba(45,51,34,0.32)] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-60 ${
            label ? 'gap-2 px-5 text-[15px] font-medium' : 'w-14'
          }`}
          onClick={handleCreate}
          disabled={isPending}
        >
          <PencilIcon />
          {label}
        </button>
      </div>

      {showPremiumSheet && (
        <PremiumUpsellSheet
          onClose={() => setShowPremiumSheet(false)}
          onUpgrade={() => navigate(ROUTES.premium)}
        />
      )}
    </>
  );
}
