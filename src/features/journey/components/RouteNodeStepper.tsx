import { RoutePlace } from '../types/route';

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

interface RouteNodeStepperProps {
  /** 순서대로 훑을 장소들. 꺼진 장소와 걸러진 날짜는 이미 빠져 있어야 한다. */
  places: RoutePlace[];
  /** 장소 → 동선 순번. 걸러 보고 있어도 전체 기준 번호를 그대로 쓴다. */
  sequenceById: Map<number, number>;
  focusedPlaceId: number | null;
  onFocus: (placeId: number) => void;
}

/**
 * 동선을 **한 곳씩 따라가는** 줄(설계서에 없던 것 — 실사용에서 나온 요구).
 *
 * 축소하면 번호가 뭉쳐 순서를 못 읽고, 그래서 확대하면 이번엔 다음 장소가 화면 밖으로
 * 나가 손으로 밀어 찾아야 했다. **읽을 수 있는 배율은 한 화면에 한두 곳뿐이라는 게 문제의
 * 뿌리라, 화면을 넓히는 대신 지도가 따라오게** 한다.
 *
 * 가운데에 지금 보는 곳의 번호와 이름을 적는다 — 화살표만 있으면 눌러놓고도 어디에 와
 * 있는지 지도에서 되짚어야 한다.
 *
 * 아직 아무 곳도 안 골랐으면 `1 / n` 대신 **`동선 따라가기`** 라고 쓴다. 0 번째라는 상태를
 * 숫자로 꾸며내지 않으려는 것이고, 그 상태에서는 어느 쪽 화살표를 눌러도 첫 곳으로 간다.
 */
export function RouteNodeStepper({
  places,
  sequenceById,
  focusedPlaceId,
  onFocus,
}: RouteNodeStepperProps) {
  if (places.length === 0) return null;

  const index = places.findIndex((place) => place.id === focusedPlaceId);
  const focused = index === -1 ? null : places[index];

  /*
    양 끝에서 반대편으로 넘어간다(순환). 20곳까지 되는 목록이라 끝에서 막아 두면 처음으로
    돌아가려고 19번을 되짚어야 한다. 끝에 왔다는 건 번호(`n / n`)가 이미 말해 준다.
  */
  const step = (delta: number) => {
    if (index === -1) {
      onFocus(places[0].id);
      return;
    }
    onFocus(places[(index + delta + places.length) % places.length].id);
  };

  return (
    /*
      지도 위에 뜨는 알약. 헤더의 뒤로가기·제목과 같은 말(반투명 크림 + 그림자)을 쓴다 —
      지도 위에 얹히는 것들은 저마다 자기 배경을 갖는 게 이 화면의 규칙이다.
      `pointer-events-none` 을 감싼 쪽에 두고 알약만 되살린다: 알약 양옆의 빈 자리는
      지도를 끌 수 있어야 한다.
    */
    <div className="pointer-events-none flex justify-center px-5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#fffcef]/95 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="이전 장소로"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#2c3930]"
        >
          <ChevronIcon className="h-5 w-5" />
        </button>

        {/* 이름이 길어도 알약이 화면을 가로지르지 않게 자른다. 번호는 안 자른다 —
            어디쯤인지를 말하는 건 이름이 아니라 번호다. */}
        <p className="min-w-0 max-w-[9.5rem] truncate px-1 text-center text-[15px] font-medium text-[#2c3930]">
          {focused ? `${sequenceById.get(focused.id)}. ${focused.name}` : '동선 따라가기'}
        </p>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="다음 장소로"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#2c3930]"
        >
          <ChevronIcon className="h-5 w-5 rotate-180" />
        </button>
      </div>
    </div>
  );
}
