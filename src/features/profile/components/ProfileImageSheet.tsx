import { Sheet } from '@/shared/components';
import trashIcon from '../assets/icons/trash.svg';

interface Props {
  onRemove: () => void;
  onClose: () => void;
}

/**
 * 프로필 사진 삭제 확인 시트.
 *
 * 사진을 바꾸는 기능은 없다 — `PATCH /users/me` 는 `profileImageUrl` 을 URL
 * 문자열로만 받는데 그 URL 을 만들어 줄 업로드 API 가 백엔드에 없다
 * (파일 업로드는 `POST /trees/{treeId}/images` 하나뿐이고 나무에 종속된 것).
 *
 * 삭제를 한 번 더 확인받는 이유: 다시 올릴 방법이 없어, 지우면 소셜 계정에서
 * 가져온 사진이 영영 사라진다. 지운 뒤에는 픽트리 나무 아이콘이 기본값이 된다.
 */
export function ProfileImageSheet({ onRemove, onClose }: Props) {
  return (
    /* 손잡이를 끌어 닫는 건 '취소' 와 같다. */
    <Sheet
      onClose={onClose}
      label="프로필 사진 제거"
      handleColor="#D9D9D9"
      animateIn={false}
      className="rounded-t-[20px] bg-[#FFFCEF]"
      contentClassName="px-6"
      bottomPadding="2rem"
    >
      <p className="text-center text-[15px] font-medium text-[#2C3930]">프로필 사진을 지울까요?</p>
      <p className="mt-1 text-center text-[13px] leading-[18px] text-[#60655C]">
        기본 이미지로 바뀌어요.
        <br />
        소셜 계정에서 가져온 사진이 지워집니다.
      </p>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-[44px] flex-1 rounded-[12px] bg-[#D9D9D9] text-[15px] font-medium text-[#2C3930]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#DC2626] text-[15px] font-medium text-white"
        >
          <img src={trashIcon} alt="" className="h-[18px] w-[18px] brightness-0 invert" />
          지우기
        </button>
      </div>
    </Sheet>
  );
}
