import type { InputHTMLAttributes } from 'react';

/** 공용 입력창. 표준 input 속성 + RHF register() 호환. className 으로 확장. */
type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-pictree-700 ${className}`}
      {...props}
    />
  );
}
