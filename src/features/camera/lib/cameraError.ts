/**
 * `getUserMedia` 실패를 **사용자가 할 수 있는 일**로 번역한다.
 *
 * 종전엔 갈래를 안 보고 전부 '카메라를 사용할 수 없습니다. 권한을 확인해주세요.' 였다(#271).
 * 이미 거부한 사람에게 "확인해주세요" 는 **어디서 어떻게** 확인하는지를 안 알려주고, 카메라가
 * 아예 없거나 다른 앱이 잡고 있을 때는 권한 이야기 자체가 틀린 안내다.
 *
 * ⚠️ `navigator.permissions.query({ name: 'camera' })` 로 **미리** 조회하는 길은 안 쓴다 —
 * iOS(iPhone Chrome 포함)에서 지원이 불확실하다. 실패한 뒤에 `name` 을 보는 이 방식은
 * 어느 브라우저에서나 동작한다.
 *
 * ⚠️ 대처를 **지어내지 않는다.** 카메라가 없는 기기에는 할 수 있는 일이 없으므로 한 줄로 끝낸다
 * (값을 모를 때 채우지 않는다는 규칙을 문구에도 적용한 것이다).
 */

/**
 * 실패 원인 → 문구. 이름이 브라우저마다 갈려 옛 이름도 같이 받는다
 * (`PermissionDeniedError`·`DevicesNotFoundError`·`TrackStartError` 는 표준 이전 크롬/파이어폭스).
 */
const MESSAGE_BY_ERROR_NAME: Record<string, string> = {
  // 되살리는 길이 브라우저 설정뿐이다 — 앱에서 다시 물어도 창이 안 뜬다.
  NotAllowedError: '카메라 권한이 꺼져 있어요.\n브라우저 설정에서 이 사이트의 카메라를 허용해 주세요.',
  PermissionDeniedError:
    '카메라 권한이 꺼져 있어요.\n브라우저 설정에서 이 사이트의 카메라를 허용해 주세요.',

  // 장치가 없다. 사용자가 할 수 있는 것이 없으므로 대처를 붙이지 않는다.
  NotFoundError: '연결된 카메라를 찾지 못했어요.',
  DevicesNotFoundError: '연결된 카메라를 찾지 못했어요.',
  // 요청한 조건(해상도·특정 장치)을 만족하는 카메라가 없다. 사용자에겐 '없다' 와 같은 말이다.
  OverconstrainedError: '이 기기의 카메라를 열 수 없어요.',

  // 장치는 있는데 다른 앱·탭이 붙잡고 있다. 이때만 "닫고 다시" 가 맞는 안내다.
  NotReadableError: '다른 앱이 카메라를 쓰고 있어요.\n그 앱을 닫고 다시 시도해 주세요.',
  TrackStartError: '다른 앱이 카메라를 쓰고 있어요.\n그 앱을 닫고 다시 시도해 주세요.',
};

const FALLBACK_MESSAGE = '카메라를 열지 못했어요.\n잠시 후 다시 시도해 주세요.';

/**
 * HTTPS(또는 localhost) 가 아니면 `navigator.mediaDevices` **자체가 없어서** 실패가
 * `getUserMedia` 를 부르기도 전에 난다. 실기기 확인을 ngrok 으로 하는 이유가 이것이다.
 * 아주 낡은 브라우저도 같은 자리로 오므로 문구가 원인 둘을 함께 덮는다.
 */
export const CAMERA_UNSUPPORTED_MESSAGE =
  '이 페이지에서는 카메라를 쓸 수 없어요.\n주소가 https 인지 확인해 주세요.';

/** 이 브라우저·연결에서 카메라 API 를 부를 수 있는가. */
export function isCameraApiAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * 던져진 것에서 `name` 만 꺼낸다.
 *
 * ⚠️ `instanceof Error` 로 거르면 안 된다 — `OverconstrainedError` 는 `Error` 를 상속하지 않는
 * 별도 인터페이스라(`name`·`constraint` 만 든 객체) 그 검사에서 통째로 탈락한다.
 */
function getErrorName(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('name' in error)) return '';
  const { name } = error as { name: unknown };
  return typeof name === 'string' ? name : '';
}

/** `getUserMedia` 가 던진 것을 원인별 안내 문구로 바꾼다. */
export function getCameraErrorMessage(error: unknown): string {
  return MESSAGE_BY_ERROR_NAME[getErrorName(error)] ?? FALLBACK_MESSAGE;
}
