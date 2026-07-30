import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { PencilIcon } from './icons';

/**
 * 작성 진입 플로팅 버튼. 하단 탭바 위 우하단에 고정.
 * 탭바는 h-[86px] + pb-safe 라 홈 인디케이터가 있는 기기에서 더 커진다.
 * bottom 을 102px 고정으로 두면 그만큼 FAB 하단이 탭바에 가려 잘리므로
 * safe-area-inset-bottom 을 더해 항상 탭바 위에 뜨게 한다.
 * 모달 정렬 관례대로 390px 컬럼에 맞춰 띄우고, 래퍼는 클릭을 통과시킨다.
 */
export function BlogCreateFab() {
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto sm:max-w-[390px]">
      <button
        type="button"
        aria-label="블로그 작성하기"
        className="pointer-events-auto absolute bottom-[calc(102px+env(safe-area-inset-bottom))] right-5 grid h-14 w-14 place-items-center rounded-full bg-[#7f9648] text-white shadow-[0_10px_22px_rgba(45,51,34,0.32)] transition-transform active:scale-95"
        onClick={() => navigate(ROUTES.blogCreate)}
      >
        <PencilIcon />
      </button>
    </div>
  );
}
