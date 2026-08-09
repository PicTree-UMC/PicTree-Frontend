import { Sheet } from '@/shared/components';
import { CALENDAR_LEVELS } from '../lib/calendarLevel';
import treeIcon from '../assets/icons/tree.svg';

/**
 * 잔디 색이 뜻하는 것 — 캘린더 헤더의 `i` 로 여는 바텀시트.
 *
 * **예전에는 캘린더 바로 아래 늘 펼쳐진 패널이었다.** 한 번 읽으면 끝인 안내인데 화면
 * 아래쪽을 계속 차지했고, 날짜를 누르면 뜨는 나무 목록이 그 자리를 원했다. 필요할 때만
 * 꺼내 보는 시트로 옮기면 둘이 자리를 다투지 않는다.
 *
 * 겉모습은 **동선 만들기 ②의 시트(`RoutePlaceStrip`)를 따른다** — 흰 바닥, `rounded-t-[20px]`,
 * 위로 뜨는 그림자, 작은 회색 그립 손잡이. 앞으로 시트는 이쪽으로 통일한다.
 * 크림 바닥이 아닌 이유는 그쪽 주석에 적혀 있다: 시트의 역할색은 흰색(#FFFFFF)이고,
 * 크림·연초록은 **패널의 색이지 시트의 색이 아니다.**
 *
 * ⚠️ 딤은 남긴다. `RoutePlaceStrip` 이 딤을 안 까는 건 **뒤가 지도**라서다
 * (지도를 어둡게 덮으면 시트를 연 목적이 사라진다). 여기 뒤는 크림 페이지라, 딤이 없으면
 * 흰 시트가 페이지의 일부인지 위에 뜬 것인지 구분되지 않는다.
 */
export function GrassLegendSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      onClose={onClose}
      label="잔디 색 안내"
      handleColor="#d9d9d9"
      handleSize="grip"
      className="rounded-t-[20px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      contentClassName="px-5"
      bottomPadding="1.25rem"
    >
      <div className="flex items-center justify-center gap-2 pt-2">
        <img src={treeIcon} alt="" className="h-5 w-5" />
        <p className="text-[15px] font-medium text-[#2c3930]">
          하루에 심은 나무 수만큼 잔디가 진해져요
        </p>
      </div>

      {/*
        items-start 로 두고 적음·많음 에만 mt 를 준다. 라벨이 붙은 만큼 열이 길어져도
        두 글자는 점 높이(20px) 가운데에 계속 걸리게 하려는 것.

        열 너비는 점(20px)이 아니라 **가장 긴 라벨**('3~4그루')에 맞춘다. 점 너비로 잡아
        두면 라벨이 칸 밖으로 삐져나와 옆 라벨과 맞붙어 읽힌다.

        ⚠️ `w-12`(48px) 였다 — 라벨이 '3~4곳' 에서 '3~4그루' 로 길어지면서 13px 기준 47px 로
        칸에 딱 붙어, 폰트가 조금만 넓어도 `whitespace-nowrap` 이 옆으로 삐져나온다.
        56px 로 올려도 줄 전체는 312px 라 시트 폭(390-40)에 넉넉히 들어간다.
      */}
      <div className="mt-5 flex items-start justify-center gap-1">
        <span className="mt-[5px] px-1 text-[13px] text-[#2c3930]">적음</span>
        {CALENDAR_LEVELS.map(({ shade, label }) => (
          <span key={label} className="flex w-14 flex-col items-center gap-1.5">
            <span className="h-5 w-5 rounded-full" style={{ backgroundColor: shade }} />
            <span className="whitespace-nowrap text-[13px] leading-none text-[#2c3930]">
              {label}
            </span>
          </span>
        ))}
        <span className="mt-[5px] px-1 text-[13px] text-[#2c3930]">많음</span>
      </div>

      <p className="mt-5 text-center text-[13px] leading-[18px] text-[#60655C]">
        날짜를 누르면 그날 심은 나무를 볼 수 있어요.
      </p>
    </Sheet>
  );
}
