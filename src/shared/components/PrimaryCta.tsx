import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type PrimaryCtaProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

/**
 * 화면 맨 아래에 폭을 꽉 채우고 앉는 주요 동작 버튼 — '다음', '동선 저장' 같은 것.
 *
 * **`Button` 과 다른 물건이다.** `Button` 은 글 흐름 안에 놓이는 작은 버튼이고(`rounded-md`
 * `px-4 py-2`), 이건 화면의 마지막 한 수다. `className` 으로 겹쳐 쓰면 라운드·높이가 서로
 * 이기려 들어서 결과가 클래스 문자열 순서가 아니라 CSS 파일 순서에 달리게 된다 — 그래서
 * 변형으로 얹지 않고 따로 둔다.
 *
 * 잠긴 상태는 **투명도가 아니라 회색**이다. 반투명은 뒤 배경색에 따라 밝기가 달라져서, 크림
 * 위에서는 잠긴 게 잘 안 읽히고 흰 시트 위에서는 지나치게 흐려진다.
 *
 * ⚠️ 잠갔으면 **버튼 글자로 이유를 말할 것** — 이 버튼은 화면에서 유일한 다음 수라, 눌리지
 * 않는데 이유가 없으면 화면이 고장 난 것으로 읽힌다(`동선 이름을 입력해주세요`).
 */
export function PrimaryCta({ children, className = '', ...props }: PrimaryCtaProps) {
  return (
    <button
      type="button" // 폼 안에서 실수로 submit 되지 않도록
      className={`h-[52px] w-full rounded-[24px] bg-pictree-700 text-[15px] font-medium text-white transition-colors disabled:bg-ink-disabled ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
