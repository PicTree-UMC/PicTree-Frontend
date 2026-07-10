import { useEffect } from 'react';

/**
 * iOS Safari는 노치 등 안전영역을 페이지 콘텐츠가 아니라 html/body 의 배경색으로 채운다.
 * 전체화면 어두운 테마 화면(카메라 등)에 진입한 동안만 html/body 배경을 바꿔서
 * 안전영역이 콘텐츠와 이어져 보이게 하고, 나가면 원래 배경으로 복원한다.
 */
export function useBodyBackground(color: string) {
  useEffect(() => {
    const { body, documentElement: html } = document;
    const prevBody = body.style.backgroundColor;
    const prevHtml = html.style.backgroundColor;

    body.style.backgroundColor = color;
    html.style.backgroundColor = color;

    return () => {
      body.style.backgroundColor = prevBody;
      html.style.backgroundColor = prevHtml;
    };
  }, [color]);
}
