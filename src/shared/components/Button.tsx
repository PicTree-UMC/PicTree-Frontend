import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-pictree-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pictree-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
