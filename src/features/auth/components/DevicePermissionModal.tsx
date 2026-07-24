import type { ReactNode } from 'react';

import { Button } from '../../../shared/components';

type DevicePermissionModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
};

export function DevicePermissionModal({ isOpen, onConfirm }: DevicePermissionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <section
        aria-modal="true"
        className="w-full max-w-[22rem] rounded-[1.125rem] bg-[#FFFDF4] px-[1.375rem] pb-6 pt-7"
        role="dialog"
      >
        <h2 className="font-['KOROAD'] text-[1.25rem] font-bold text-[#111]">
          기기 접근 권한 안내
        </h2>

        <div className="mt-4 rounded-[1.125rem] bg-[#FFFDF7] px-5 py-4">
          <PermissionRow icon={<CameraIcon />} title="카메라 접근" description="즉석에서 사진을 촬영하기 위해 사용해요." />
          <PermissionRow icon={<AlbumIcon />} title="사진 · 앨범 접근" description="이미지 업로드가 필요할 때 사용해요" />
          <PermissionRow icon={<LocationIcon />} title="위치 정보 · 사진 EXIF 위치" description="장소와 동선을 지도에 기록하기 위해 사용해요" />
        </div>

        <h3 className="mt-4 font-['KOROAD'] text-[1.125rem] font-bold text-[#111]">보관 및 삭제</h3>
        <div className="mt-3 rounded-[1.125rem] bg-[#FFFDF7] px-4 py-4 font-['KOROAD'] text-[0.75rem] font-medium leading-7 text-[#111]">
          <p>사진·기록·위치정보는 회원 탈퇴 시까지 보관되며,</p>
          <p>탈퇴하면 관련 데이터가 지체 없이 파기됩니다.</p>
          <p>(관계 법령상 보존이 필요한 경우 해당 기간 동안만 별도 보관)</p>
        </div>

        <Button
          unstyled
          className="mt-5 flex h-[2.4375rem] w-full items-center justify-center rounded-[0.625rem] bg-[#C5D89D] font-['KOROAD'] text-[1rem] font-bold text-[#2C3930]"
          type="button"
          onClick={onConfirm}
        >
          확인
        </Button>
      </section>
    </div>
  );
}

function PermissionRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center text-[#5C6F2B]">{icon}</span>
      <div>
        <p className="font-['KOROAD'] text-[1rem] font-bold text-[#111]">{title}</p>
        <p className="mt-0.5 font-['KOROAD'] text-[0.75rem] font-medium text-[#111]">
          {description}
        </p>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg fill="currentColor" height="32" viewBox="0 0 32 32" width="32">
      <path d="M11.2 8L13 5.5h6L20.8 8H25a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h4.2ZM16 22.5a5.5 5.5 0 1 0 0-11a5.5 5.5 0 0 0 0 11Zm0-2.8a2.7 2.7 0 1 1 0-5.4a2.7 2.7 0 0 1 0 5.4Z" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg fill="currentColor" height="32" viewBox="0 0 32 32" width="32">
      <path d="M6 6h20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Zm-1.5 11h17l-5.7-7.2l-4.5 5.4l-2.6-3.1L7.5 22.5Z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg fill="currentColor" height="32" viewBox="0 0 32 32" width="32">
      <path d="M16 3.5a9.5 9.5 0 0 0-9.5 9.5c0 7.1 9.5 15.5 9.5 15.5S25.5 20.1 25.5 13A9.5 9.5 0 0 0 16 3.5Zm0 12.8a3.3 3.3 0 1 1 0-6.6a3.3 3.3 0 0 1 0 6.6Z" />
    </svg>
  );
}
