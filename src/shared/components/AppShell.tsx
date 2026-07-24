import type { ReactNode } from 'react';

/**
 * 앱 전체를 감싸는 반응형 셸. 라우터보다 바깥에 두어 모든 화면에 일괄 적용된다.
 *
 * 시안이 전부 390px 모바일 프레임이라 데스크톱 레이아웃은 존재하지 않는다.
 * 그래서 폰(<640px)에서는 기기 폭을 꽉 채우고, 그 이상에서만 390px 컬럼으로 묶어
 * 가운데 정렬한다(`sm:max-w-[390px]`). `sm:` 없이 `max-w-[390px]` 로 쓰면
 * 430px 폰에서 좌우가 letterbox 처럼 뜨므로 주의.
 *
 * 가로 패딩은 절대 주지 않는다 — 지도처럼 full-bleed 가 필요한 화면이 깨진다.
 * 여백은 페이지 책임.
 *
 * 바텀시트·모달은 createPortal 로 document.body 에 붙어 이 컬럼 밖에 그려지지만,
 * 각자 `fixed inset-x-0 mx-auto sm:max-w-[390px]` 를 쓰고 있어 같은 자리에 정렬된다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    // 컬럼 바깥 배경. 데스크톱에서만 보인다.
    // 시안에 데스크톱이 없어 정해진 값이 없다. 앱이 크림(PicTree/100 #FFFCEF) 계열이라
    // 같은 온도의 무채색을 써서 배경이 물러나게 했다. 채도 있는 브랜드색(PicTree/800 등)은
    // 넓은 면적에서 앱과 색이 부딪혀 배경이 앞으로 튄다.
    <div className="min-h-dvh bg-[#efede7]">
      <div className="mx-auto h-dvh w-full overflow-y-auto overscroll-none bg-white sm:max-w-[390px] sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
