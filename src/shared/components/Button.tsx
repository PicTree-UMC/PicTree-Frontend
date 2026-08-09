import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

/** 공용 버튼. 표준 button 속성을 그대로 받고, className 으로 스타일 덮어쓰기 가능. */
type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    unstyled?: boolean;
  }
>;

export function Button({
  children,
  className = '',
  type = 'button',
  unstyled = false,
  ...props
}: ButtonProps) {
  // hover 가 `bg-pictree-500` 이었다 — 눌렀을 때 배경이 **밝아지면서** 흰 글자 대비가 무너진다
  // (옛 값에서는 1.88:1). 500 은 흰 글자를 못 얹는 색이라 새 값으로도 3.5:1 이라 여전히 미달.
  // 초록을 하나 더 만드는 대신 같은 700 을 옅게 눌러 상태 변화만 준다.
  const baseClass =
    'rounded-md bg-pictree-700 px-4 py-2 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      className={unstyled ? className : `${baseClass} ${className}`}
      type={type} // 폼 안에서 실수로 submit 되지 않도록 기본값 button
      {...props}
    >
      {children}
    </button>
  );
}
