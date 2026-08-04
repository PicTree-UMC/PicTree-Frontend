import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 헤더 뒤로가기용 이동 함수.
 *
 * **기본은 `navigate(-1)`.** 히스토리 스택이 자라지 않고, 화면의 ← 와 안드로이드 하드웨어 백·
 * iOS 스와이프가 같은 동작이 된다. 명시 경로로 되돌리면(push) 왔던 길이 스택에 계속 쌓여
 * 기기 백으로 흐름을 거꾸로 다시 밟게 되고, 두 화면이 서로를 가리키면 아예 루프가 된다.
 *
 * 위험한 경우는 **딱 하나 — 지금 항목이 이 세션 히스토리의 첫 항목일 때**다. 뒤로 갈 데가
 * 없어서 앱 밖으로 나가거나(브라우저 탭), PWA standalone 에서는 아무 일도 안 일어나 버튼이
 * 죽은 것처럼 보인다. 이 앱에서 실제로 걸리는 길:
 * - 공유 링크·푸시·주소 직접 입력으로 그 화면에 바로 진입
 * - 홈 화면에 추가한 PWA 아이콘으로 시작
 * - **외부 리다이렉트 착지** — OAuth 는 `window.location.assign()` 전체 문서 이동이고
 *   토스 결제도 successUrl/failUrl 로 돌아온다. 그 문서에서 뒤로 가면 외부 오리진이 나온다.
 *
 * 리액트 라우터는 그 첫 항목에 `key: 'default'` 를 준다. 새로고침 뒤에도 `default` 로
 * 리셋되는데, 그때는 뒤로 갈 수 있는데도 부모로 간다 — **안전한 쪽으로 빗나가는** 것이라
 * 그대로 둔다(반대로 빗나가면 앱 밖으로 나간다).
 *
 * `fallback` 은 그 화면의 **부모**를 준다(직전 화면이 아니라). 히스토리가 없다는 건 어디서
 * 왔는지 모른다는 뜻이라, 짐작 가능한 자리는 위쪽 한 칸뿐이다.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const { key } = useLocation();

  return useCallback(() => {
    if (key === 'default') {
      // replace: 갈 수 없었던 항목을 스택에 남기지 않는다 — 남기면 부모에서 또 뒤로 갈 때
      // 방금 떠난 화면으로 되돌아온다.
      navigate(fallback, { replace: true });
      return;
    }

    navigate(-1);
  }, [navigate, key, fallback]);
}
