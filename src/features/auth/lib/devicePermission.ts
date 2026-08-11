/**
 * 기기 접근 권한 안내 모달의 '확인' 에서 **진짜 브라우저 권한 창**을 띄운다.
 *
 * 종전엔 모달이 안내만 하고 닫혀서 사용자는 같은 이야기를 두 번 겪었다 — 가입 직후
 * "카메라를 씁니다" 안내를 보고, 한참 뒤 카메라 화면에서 진짜 팝업을 다시 만난다(#271).
 *
 * ⚠️ **프롬프트 횟수가 주는 것은 아니다.** 한 번 뜰 것을 **맥락이 있는 자리로 옮기는** 것이고,
 * 이 모달은 **신규 가입 흐름에만** 뜬다(재로그인 경로에는 없다).
 *
 * ⚠️ **받은 트랙은 즉시 `stop()`.** 안 그러면 가입 직후부터 카메라 표시등이 켜진 채 남는다.
 *
 * ⚠️ **위치는 여기서 안 묻는다.** 팝업 둘을 연달아 띄우면 두 번째가 무엇에 대한 물음인지
 * 알 수 없고, 위치는 홈 지도가 뜨는 그 자리에서 물어야 맥락이 분명하다.
 */
export async function requestCameraPermission(): Promise<void> {
  // http 로 열었거나 낡은 브라우저면 API 자체가 없다. 가입은 그래도 끝나야 한다.
  if (!navigator.mediaDevices?.getUserMedia) return;

  try {
    /*
      해상도를 안 건다 — 여기서 여는 스트림은 **바로 버릴 것**이라 화질이 필요 없고,
      까다로운 제약은 권한과 무관한 이유(OverconstrainedError)로 실패할 수 있다.
    */
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    /*
      거부·장치 없음이 모두 여기로 온다. **삼키고 진행한다** — 권한 하나로 가입을 막을 이유가
      없고, 거부한 사람은 카메라 화면에서 원인별 안내를 만난다(`camera/lib/cameraError.ts`).
    */
  }
}
