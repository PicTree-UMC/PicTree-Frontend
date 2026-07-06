import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { AUTH_VIEW_COPY } from '../constants/authViewCopy';
import { validateAuthForm, type AuthFormErrors } from '../lib/validateAuthForm';
import type { AuthField, AuthFormMode, AuthSubmitValues } from '../types/auth';
import { AuthTextField } from './AuthTextField';

type AuthFormProps = {
  fields: AuthField[];
  mode: AuthFormMode;
  onSubmit: (values: AuthSubmitValues) => void;
  onToggle: () => void;
};

export function AuthForm({ fields, mode, onSubmit, onToggle }: AuthFormProps) {
  const copy = AUTH_VIEW_COPY[mode];
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const validationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (validationTimerRef.current) {
        window.clearTimeout(validationTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationTimerRef.current) {
      window.clearTimeout(validationTimerRef.current);
    }

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => [field.name, String(formData.get(field.name) ?? '')]),
    ) as Record<string, string>;

    const submitValues = values as AuthSubmitValues;
    const validationErrors = validateAuthForm(mode, submitValues);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onSubmit(submitValues);
  };

  const handleInput = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const fieldName = target.name as keyof AuthFormErrors;
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => [field.name, String(formData.get(field.name) ?? '')]),
    ) as Record<string, string>;
    const submitValues = values as AuthSubmitValues;

    if (validationTimerRef.current) {
      window.clearTimeout(validationTimerRef.current);
    }

    validationTimerRef.current = window.setTimeout(() => {
      const validationErrors = validateAuthForm(mode, submitValues);

      setErrors((prev) => {
        const nextErrors = { ...prev, [fieldName]: validationErrors[fieldName] };

        if (mode === 'signup' && (fieldName === 'password' || fieldName === 'passwordConfirm')) {
          nextErrors.password = validationErrors.password;
          nextErrors.passwordConfirm = validationErrors.passwordConfirm;
        }

        return nextErrors;
      });
    }, 500);
  };

  return (
    <form className="flex flex-1 flex-col px-1" onInput={handleInput} onSubmit={handleSubmit}>
      <div className="mt-[132px]">
        <h1 className="font-['KOROAD'] text-[22px] font-bold leading-normal text-[#2C3930]">{copy.title}</h1>
        <p className="mt-3 flex h-[38px] w-[282px] flex-col justify-center font-['KOROAD'] text-[16px] font-medium leading-[40px] text-[#2C3930]">
          {copy.description}
        </p>
      </div>

      <div className="mt-[54px]">
        {fields.map((field, index) => (
          <div
            key={field.name}
            className={
              index === 0 ? '' : mode === 'signup' && field.name === 'passwordConfirm' ? 'mt-3' : 'mt-7'
            }
          >
            <AuthTextField
              field={field}
              hasError={Boolean(errors[field.name])}
              errorMessage={errors[field.name]}
              showFindPassword={mode === 'login'}
            />
          </div>
        ))}
      </div>

      <div className={mode === 'signup' ? 'mt-[54px] pb-1' : 'mt-auto pb-1'}>
        <button
          className={
            mode === 'signup'
              ? "flex h-[56px] w-[332px] items-center justify-center self-center rounded-[24px] bg-[#C5D89D] text-[17px] font-extrabold text-white transition hover:bg-[#b7cf88] active:bg-[#8b9d70]"
              : 'h-[56px] w-full rounded-[18px] bg-[#c5dc98] text-[17px] font-extrabold text-white transition hover:bg-[#b7cf88] active:bg-[#8b9d70]'
          }
          type="submit"
        >
          {copy.submitLabel}
        </button>
        <p className="mt-4 text-center text-[14px] font-semibold text-[#a1a18e]">
          {copy.footerText}
          <button
            className="ml-3 text-[#9ba86f] transition hover:text-[#75864d]"
            type="button"
            onClick={onToggle}
          >
            {copy.footerAction}
          </button>
        </p>
      </div>
    </form>
  );
}
