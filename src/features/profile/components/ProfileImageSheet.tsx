import trashIcon from "../assets/icons/trash.svg";

interface Props {
  onRemove: () => void;
  onClose: () => void;
}

/**
 * 프로필 사진 제거 확인 시트.
 *
 * 사진을 "교체" 하는 항목은 두지 않았다. `PATCH /users/me` 는 `profileImageUrl` 을
 * URL 문자열로만 받는데 그 URL 을 만들어 줄 업로드 API 가 백엔드에 없다
 * (파일 업로드는 `POST /trees/{treeId}/images` 하나뿐이고 나무에 종속된 것).
 * 업로드 엔드포인트가 생기면 여기에 항목을 하나 더 붙이면 된다.
 *
 * 제거를 한 번 더 확인받는 이유: 지금은 사진을 다시 올릴 방법이 없어, 지우면
 * 소셜 계정에서 가져온 사진이 영영 사라진다.
 */
export function ProfileImageSheet({ onRemove, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="프로필 사진 제거"
        className="w-full rounded-t-[20px] bg-[#FFFCEF] px-6 pb-8 pt-3 sm:max-w-[390px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-[5px] w-[134px] rounded-full bg-[#D9D9D9]" />

        <p className="text-center text-base font-bold text-[#2C3930]">
          프로필 사진을 지울까요?
        </p>
        <p className="mt-1 text-center text-xs leading-[18px] text-[#8D8D8D]">
          기본 이미지로 바뀌어요. 지금은 사진을 다시 올릴 수 없어
          <br />
          소셜 계정에서 가져온 사진이 사라집니다.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[44px] flex-1 rounded-[12px] bg-[#E6E6E6] text-[15px] font-semibold text-[#2C3930]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#FF5858] text-[15px] font-semibold text-white"
          >
            <img src={trashIcon} alt="" className="h-[18px] w-[18px] brightness-0 invert" />
            지우기
          </button>
        </div>
      </div>
    </div>
  );
}
