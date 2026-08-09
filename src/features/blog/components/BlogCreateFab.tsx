import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { PencilIcon } from './icons';
import { useBlogDraftUsage } from '../hooks/useBlogDraftUsage';
import { PremiumUpsellSheet } from './PremiumUpsellSheet';

/**
 * 작성 진입 플로팅 버튼. 하단 탭바 위 우하단에 고정.
 * 띄우는 높이는 `bottom-nav` 유틸에 맡긴다 — 탭바 높이 + 하단 안전영역을
 * 한곳에서 계산하므로 여기서 px 를 따로 들고 있을 필요가 없다.
 * 모달 정렬 관례대로 390px 컬럼에 맞춰 띄우고, 래퍼는 클릭을 통과시킨다.
 */
export function BlogCreateFab() {
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
    navigate(ROUTES.blogCreate);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto sm:max-w-[390px]">
        <button
          type="button"
          aria-label="블로그 작성하기"
          className="bottom-nav pointer-events-auto absolute right-5 grid h-14 w-14 place-items-center rounded-full bg-pictree-700 text-white shadow-[0_10px_22px_rgba(45,51,34,0.32)] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-60"
          onClick={handleCreate}
          disabled={isPending}
        >
          <PencilIcon />
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
