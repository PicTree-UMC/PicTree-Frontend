import { useEffect, useRef, useState } from 'react';

interface Options {
  /** 요소가 이만큼 보이면 '들어왔다'로 친다. 기본 0.3 = 30%. */
  threshold?: number;
  /** 한 번 들어오면 다시 나가도 계속 true. 기본은 false(나갔다 들어오면 다시 재생). */
  once?: boolean;
}

/**
 * 요소가 화면에 들어왔는지 알려준다. 스크롤에 맞춰 애니메이션을 트는 데 쓴다.
 *
 * **화면 밖에서 재생을 시작하면 안 되기 때문에 필요하다.** 페이지 아래쪽 섹션의 연출은
 * 마운트 시점에 그냥 틀면 사용자가 스크롤해 내려왔을 땐 이미 끝나 있다.
 *
 * 스크롤 이벤트가 아니라 `IntersectionObserver` 를 쓴다 — 스크롤마다 콜백이 도는 대신
 * 브라우저가 교차할 때만 알려주고, 이 앱은 실제 스크롤 주체가 `window` 가 아니라
 * `Layout` 안쪽 div 라(styles.css 가 html/body 를 100% 로 묶어둔다) 스크롤 이벤트를
 * 어디에 걸지부터 갈린다. 옵저버는 조상 중 스크롤되는 것을 알아서 찾는다.
 *
 * `once: false` 일 때 **완전히 벗어나야(0%)** 다시 false 가 된다. 경계에서 임계값을
 * 오갈 때 재생이 끊겼다 이어지는 깜빡임을 막기 위해서다.
 */
export function useInView<T extends HTMLElement>({ threshold = 0.3, once = false }: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 옵저버가 없는 환경(구형 사파리·테스트)에서는 그냥 보이는 것으로 친다 —
    // 연출을 못 보는 것보다 최종 상태로 남는 편이 낫다.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once && entry.intersectionRatio === 0) {
          setInView(false);
        }
      },
      // 0 을 같이 넣어야 '완전히 벗어남' 을 따로 알 수 있다.
      { threshold: [0, threshold] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, inView };
}
