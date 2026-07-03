import type { AuthField } from '../types/auth';

type AuthTextFieldProps = {
  field: AuthField;
  showFindPassword?: boolean;
};

export function AuthTextField({ field, showFindPassword = false }: AuthTextFieldProps) {
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
      <input
        autoComplete={field.autoComplete}
        className="h-[50px] w-full rounded-[17px] bg-[#f5f0d8] px-7 text-[13px] font-bold text-[#263122] outline-none placeholder:text-[#aba994] focus:ring-2 focus:ring-[#c5dc98]"
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        type={field.type ?? 'text'}
      />
    </div>
  );
}
