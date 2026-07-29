import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { PencilIcon } from './icons';

/**
 * 작성 진입 플로팅 버튼. 하단 탭바(86px) 위 우하단에 고정.
 * 모달 정렬 관례대로 390px 컬럼에 맞춰 띄우고, 래퍼는 클릭을 통과시킨다.
 */
export function BlogCreateFab() {
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto sm:max-w-[390px]">
      <button
        type="button"
        aria-label="블로그 작성하기"
        className="pointer-events-auto absolute bottom-[102px] right-5 grid h-14 w-14 place-items-center rounded-full bg-[#7f9648] text-white shadow-[0_10px_22px_rgba(45,51,34,0.32)] transition-transform active:scale-95"
        onClick={() => navigate(ROUTES.blogCreate)}
      >
        <PencilIcon />
      </button>
    </div>
  );
}
