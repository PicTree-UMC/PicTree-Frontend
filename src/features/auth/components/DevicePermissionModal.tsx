import type { ReactNode } from 'react';

import { Button } from '../../../shared/components';

type DevicePermissionModalProps = {
  isOpen: boolean;
  /** 브라우저 권한 창이 떠 있는 동안. 확인 버튼을 잠가 연타를 막는다. */
  isRequesting?: boolean;
  onConfirm: () => void;
};

export function DevicePermissionModal({
  isOpen,
  isRequesting = false,
  onConfirm,
}: DevicePermissionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    // 이 모달은 길다(권한 행 셋이던 때 568px, 앨범 행을 뺀 지금은 그보다 한 행 짧다).
    // 짧은 뷰포트(주소창 뜬 iPhone SE, 가로 모드)에서는 그래도 화면을
    // 넘치는데, 예전엔 `items-center` + overflow visible 이라 위아래가 잘린 채 스크롤도
    // 안 돼 '확인' 버튼에 닿을 수 없었다.
    //  - overflow-y-auto 로 넘칠 땐 스크롤. 단 `items-center` 와 같이 쓰면 위로 넘친 부분이
    //    스크롤로 도달되지 않으므로, 가운데 정렬은 자식의 `my-auto` 로 한다
    //    (auto 마진은 남는 공간이 없으면 0 이 되어 잘리지 않는다).
    //  - py 는 safe-area 최소값. 상태바·홈 인디케이터 아래로 모달이 들어가지 않게 한다.
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/40 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1.25rem)]">
      <section
        aria-modal="true"
        className="my-auto w-full max-w-[22rem] shrink-0 rounded-[1.125rem] bg-cream px-[1.375rem] pb-6 pt-7"
        role="dialog"
      >
        <h2 className="font-['KOROAD'] text-[1.25rem] font-bold text-ink">
          기기 접근 권한 안내
        </h2>

        {/*
          '사진 · 앨범 접근' 은 지웠다(#271). 앱에 `<input type="file">` 이 한 곳도 없고
          앨범 선택·프로필 이미지 업로드는 **예정에도 없다**고 확인됐다 — 없는 기능을 설명하는
          고지는 사용자가 검증할 수 없는 약속이 된다. 기능이 생기면 그때 되살린다.
        */}
        <div className="mt-4 rounded-[1.125rem] bg-white px-5 py-4">
          <PermissionRow icon={<CameraIcon />} title="카메라 접근" description="즉석에서 사진을 촬영하기 위해 사용해요." />
          <PermissionRow icon={<LocationIcon />} title="위치 정보" description="장소와 동선을 지도에 기록하기 위해 사용해요" />
        </div>

        <h3 className="mt-4 font-['KOROAD'] text-[1.125rem] font-bold text-ink">보관 및 삭제</h3>
        <div className="mt-3 rounded-[1.125rem] bg-white px-4 py-4 font-['KOROAD'] text-[0.75rem] font-medium leading-7 text-ink">
          <p>사진·기록·위치정보는 회원 탈퇴 시까지 보관되며,</p>
          <p>탈퇴하면 관련 데이터가 지체 없이 파기됩니다.</p>
          <p>(관계 법령상 보존이 필요한 경우 해당 기간 동안만 별도 보관)</p>
        </div>

        {/*
          누르면 **진짜 브라우저 권한 창**이 뜬다(#271, `auth/lib/devicePermission.ts`).
          창이 떠 있는 동안은 잠근다 — `unstyled` 라 공용 `disabled:` 스타일이 안 따라오므로
          여기서 직접 준다.
        */}
        <Button
          unstyled
          className="mt-5 flex h-[2.4375rem] w-full items-center justify-center rounded-[0.625rem] bg-pictree-300 font-['KOROAD'] text-[1rem] font-bold text-ink transition disabled:opacity-60"
          disabled={isRequesting}
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
      <span className="grid h-8 w-8 shrink-0 place-items-center text-pictree-700">{icon}</span>
      <div>
        <p className="font-['KOROAD'] text-[1rem] font-bold text-ink">{title}</p>
        <p className="mt-0.5 font-['KOROAD'] text-[0.75rem] font-medium text-ink">
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

function LocationIcon() {
  return (
    <svg fill="currentColor" height="32" viewBox="0 0 32 32" width="32">
      <path d="M16 3.5a9.5 9.5 0 0 0-9.5 9.5c0 7.1 9.5 15.5 9.5 15.5S25.5 20.1 25.5 13A9.5 9.5 0 0 0 16 3.5Zm0 12.8a3.3 3.3 0 1 1 0-6.6a3.3 3.3 0 0 1 0 6.6Z" />
    </svg>
  );
}
