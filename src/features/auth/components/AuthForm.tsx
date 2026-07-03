import type { FormEvent } from 'react';

import { AUTH_VIEW_COPY } from '../constants/authViewCopy';
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData) as Record<string, string>;

    onSubmit(values as AuthSubmitValues);
  };

  return (
    <form className="flex flex-1 flex-col px-1" onSubmit={handleSubmit}>
      <div className="mt-[132px]">
        <h1 className="text-[22px] font-extrabold tracking-[0px]">{copy.title}</h1>
        <p className="mt-3 text-[15px] font-bold text-[#5b6656]">{copy.description}</p>
      </div>

      <div className="mt-[54px] space-y-7">
        {fields.map((field) => (
          <AuthTextField
            key={field.name}
            field={field}
            showFindPassword={mode === 'login'}
          />
        ))}
      </div>

      <div className="mt-auto pb-1">
        <button
          className="h-[56px] w-full rounded-[18px] bg-[#c5dc98] text-[17px] font-extrabold text-white transition hover:bg-[#b7cf88] active:bg-[#8b9d70]"
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
