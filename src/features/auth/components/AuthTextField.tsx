import { useState } from 'react';

import { Input } from '../../../shared/components';
import type { AuthField } from '../types/auth';

type AuthTextFieldProps = {
  field: AuthField;
  errorMessage?: string;
  hasError?: boolean;
  showFindPassword?: boolean;
};

export function AuthTextField({
  field,
  errorMessage,
  hasError = false,
  showFindPassword = false,
}: AuthTextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = field.type === 'password';

  const inputType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : (field.type ?? 'text');

  return (
    <div>
      {field.label ? (
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[17px] font-extrabold" htmlFor={field.name}>
            {field.label}
          </label>
          {showFindPassword && field.type === 'password' ? (
            <button
              className="text-[12px] font-bold text-[#8d917f] transition hover:text-[#5f684d]"
              type="button"
            >
              비밀번호 찾기
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="relative">
        <Input
          autoComplete={field.autoComplete}
          className={`h-[50px] w-full rounded-[17px] border-0 bg-[#f5f0d8] px-7 pr-12 text-[13px] font-bold text-[#263122] outline-none placeholder:text-[#aba994] focus:border-transparent focus:ring-2 ${hasError ? 'ring-1 ring-[#d87474] focus:ring-[#d87474]' : 'focus:ring-[#c5dc98]'}`}
          id={field.name}
          name={field.name}
          placeholder={field.placeholder}
          type={inputType}
        />
        {isPasswordField ? (
          <button
            aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d917f] transition hover:text-[#5f684d]"
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
          >
            {isPasswordVisible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.88 5.09C10.56 4.91 11.27 4.82 12 4.82C16.5 4.82 20.31 8.13 21.5 12C21.15 13.14 20.54 14.19 19.72 15.08" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.13 6.12C4.03 7.44 2.49 9.53 2 12C3.19 15.87 7 19.18 11.5 19.18C12.2 19.18 12.89 19.1 13.55 18.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 12C3.2 8.1 7 4.8 12 4.8C17 4.8 20.8 8.1 22 12C20.8 15.9 17 19.2 12 19.2C7 19.2 3.2 15.9 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      {errorMessage ? <p className="mt-2 px-2 text-[12px] font-medium text-[#c05656]">{errorMessage}</p> : null}
    </div>
  );
}
