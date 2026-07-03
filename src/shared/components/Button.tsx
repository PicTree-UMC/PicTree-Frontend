import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

/** 공용 버튼. 표준 button 속성을 그대로 받고, className 으로 스타일 덮어쓰기 가능. */
type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-pictree-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pictree-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      type={type} // 폼 안에서 실수로 submit 되지 않도록 기본값 button
      {...props}
    >
      {children}
    </button>
  );
}
