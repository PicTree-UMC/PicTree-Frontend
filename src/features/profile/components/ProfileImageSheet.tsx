import trashIcon from "../assets/icons/trash.svg";

interface Props {
  /** 지금 프로필 사진이 있는지. 없으면 "기본 이미지로 변경" 을 띄울 이유가 없다. */
  hasImage: boolean;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * 프로필 사진 변경 시트.
 *
 * ⚠️ "사진 선택" 은 아직 못 쓴다. `PATCH /users/me` 는 `profileImageUrl` 을 URL
 * 문자열로만 받는데, 그 URL 을 만들어 줄 업로드 API 가 백엔드에 없다.
 * 파일 업로드는 `POST /trees/{treeId}/images` 하나뿐이고 나무에 종속된 것이다.
 *
 * 눌리지 않는 항목을 숨기지 않고 남겨 둔 이유는, 사진을 바꾸려던 사용자가
 * 방법이 아예 없다고 오해하지 않게 하려는 것이다.
 */
export function ProfileImageSheet({ hasImage, onRemove, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="프로필 사진 변경"
        className="w-full rounded-t-[20px] bg-[#FFFCEF] px-6 pb-8 pt-3 sm:max-w-[390px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-[5px] w-[134px] rounded-full bg-[#D9D9D9]" />

        <button
          type="button"
          disabled
          className="flex w-full items-center gap-3 py-3 text-left opacity-40"
        >
          <span className="text-[22px]">🖼️</span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-[#2C3930]">
              앨범에서 선택
            </span>
            <span className="block text-xs text-[#8D8D8D]">
              사진 업로드는 준비 중이에요
            </span>
          </span>
        </button>

        {hasImage && (
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center gap-3 border-t border-[#E6E1CC] py-3 text-left"
          >
            <img src={trashIcon} alt="" className="h-[22px] w-[22px]" />
            <span className="text-base font-semibold text-[#FF5858]">
              기본 이미지로 변경
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
