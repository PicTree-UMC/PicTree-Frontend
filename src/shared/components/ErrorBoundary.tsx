import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 터졌을 때 대신 세울 화면. */
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 렌더 중 던져진 예외를 붙잡아 대체 화면을 세운다.
 *
 * **없으면 백지가 된다.** React 18 부터는 잡히지 않은 렌더 에러가 루트를 통째로
 * 언마운트해서, 컴포넌트 하나가 터지면 탭바까지 사라져 이동할 방법이 없어진다.
 *
 * 클래스인 이유는 취향이 아니다 — React 가 에러를 넘겨주는 통로가
 * `getDerivedStateFromError`/`componentDidCatch` **둘뿐이고 훅 버전이 없다.**
 *
 * ⚠️ **여기서 못 잡는 것**: 이벤트 핸들러 · `setTimeout`/프로미스 같은 비동기 ·
 * 이 컴포넌트 자신의 에러. react-query 실패도 이 경로를 안 탄다(각 화면이 `isError` 로 처리).
 *
 * 폴백을 프롭으로 받고 기본값을 두지 않는다. 기본 화면을 쥐고 있으면 부르는 쪽이
 * 자기 자리에 맞는 화면을 넘겼는지 아닌지가 코드에서 안 보인다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 무엇이 터졌는지 남겨야 버그를 옮겨 적을 수 있다. `componentStack` 이 있어야
    // 어느 화면인지 좁혀진다 — 메시지만으로는 공용 컴포넌트에서 난 것을 못 가린다.
    console.error('render error caught by ErrorBoundary', error, info.componentStack);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
