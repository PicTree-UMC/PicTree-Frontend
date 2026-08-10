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
 *
 * **시트 안에 들어가는 한 줄이다**(`RoutePlaceStrip` 의 붙박이 머리). 한동안 지도 위에 뜨는
 * 크림 알약이었는데, 시트 높이에 맞춰 띄워둔 것이라 결국 시트에 매여 있으면서 지도만 가렸다.
 * 시트 폭을 그대로 쓰는 줄이 되면서 자기 배경이 필요 없어졌고(시트가 흰 바닥을 준다),
 * 화살표는 양 끝으로 벌어져 누를 자리가 넓어졌다.
 *
 * 자기 가로 여백(`px-5`)을 갖는다 — 시트가 여백을 주지 않고 안쪽 줄들이 각자 갖는 규칙이다.
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
    <div className="flex shrink-0 items-center gap-2 px-5 pb-0.5">
      {/* 화살표는 줄의 양 끝이다 — 가운데 이름이 길든 짧든 자리가 안 움직여서, 연달아 누를 때
          손가락을 다시 겨누지 않아도 된다. 흰 바닥에서 눌리는 자리로 읽히도록 GREEN-100 을 깐다. */}
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="이전 장소로"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-ink"
      >
        <ChevronIcon className="h-5 w-5" />
      </button>

      {/* 이름이 길면 자른다. 번호는 안 자른다 — 어디쯤인지를 말하는 건 이름이 아니라 번호다. */}
      <p className="min-w-0 flex-1 truncate text-center text-[15px] font-medium text-ink">
        {focused ? `${sequenceById.get(focused.id)}. ${focused.name}` : '동선 따라가기'}
      </p>

      <button
        type="button"
        onClick={() => step(1)}
        aria-label="다음 장소로"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-ink"
      >
        <ChevronIcon className="h-5 w-5 rotate-180" />
      </button>
    </div>
  );
}
