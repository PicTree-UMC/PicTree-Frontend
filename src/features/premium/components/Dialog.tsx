import type { ReactNode } from 'react';

/**
 * 프리미엄 화면의 가운데 알림창 두 종 — 물어보는 것(`ConfirmDialog`)과 알려주는 것
 * (`DoneDialog`).
 *
 * **`ModalShell` 과 겹치지 않는다.** 저건 결제 완료 화면 하나가 쓰는 큰 카드고
 * (`px-5 pb-6 pt-10`, 풀폭), 이건 요금제 변경 흐름의 작은 확인창이다. 규격이 다르고
 * (352px · `px-6 py-8`) 버튼 배치도 다르다 — 하나로 합치면 두 규격을 옵션으로 들고
 * 있어야 해서 어느 쪽이 기본인지 알 수 없게 된다.
 *
 * **왜 나눠 뒀나.** #325 로 요금제 변경 흐름에 확인·완료 모달이 넷 붙는데, 종전 두
 * 모달(`PlanChangeModal`·`CancelSubscriptionModal`)이 이미 같은 껍데기를 각자 베껴
 * 들고 있었다. 넷을 더 베끼면 카드 폭·버튼 높이가 갈리기 시작한다 — 공용
 * `DeleteConfirmModal` 을 만들기 전에 삭제 확인이 여섯 벌이었던 것과 같은 자리다.
 *
 * ⚠️ **`CancelSubscriptionModal` 은 안 옮겼다.** 구독 해지는 되돌릴 수 없어 경고
 * 아이콘과 ERROR 색 버튼을 쓰는데, 그 둘을 옵션으로 받으면 이 껍데기가 "위험한 확인"
 * 까지 겸하게 된다. 요금제 변경은 전부 되돌릴 수 있는 동작이라 톤을 섞지 않는다.
 *
 * ⚠️ 공용 `DeleteConfirmModal`(shared)도 아니다. 그쪽은 파괴적 동작 전용이라 iOS 알럿
 * 규격(흰 카드 · 세로 버튼 스택 · 빨강)이고, 여기 문맥에서는 예약 하나 거는 일이
 * 삭제처럼 읽힌다.
 */

/**
 * 크림 카드 껍데기. 배경을 누르면 닫힌다 — 요청이 나가 있는 동안에는 부르는 쪽이
 * `onDismiss` 를 비워 잠근다.
 */
function DialogShell({
  label,
  onDismiss,
  children,
}: {
  /** 낭독기가 읽을 창 이름. 제목과 겹쳐도 되지만 '무엇을 하는 창인가' 로 쓴다. */
  label: string;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-[352px] rounded-[20px] bg-cream px-6 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  label: string;
  title: string;
  /** 제목 아래 본문. **잔글씨가 아니다** — 이 동작이 실제로 무엇인지가 여기 있다. */
  description: ReactNode;
  /** 본문 아래 강조 블록(바뀌는 값 등). 없으면 안 그린다. */
  detail?: ReactNode;
  /** 왼쪽(물러나는) 버튼 글자. */
  keepLabel: string;
  /** 오른쪽(실행하는) 버튼 글자. */
  confirmLabel: string;
  /** 요청이 나가 있는 동안 두 버튼이 잠긴다. 응답이 올 때까지 창이 그대로 떠 있어서 필요하다. */
  isPending?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
};

/**
 * 되돌릴 수 있는 동작을 확인받는 창. 버튼 둘이 가로로 나란히 선다.
 *
 * **경고 아이콘도 빨강도 안 쓴다.** 요금제 변경·예약 취소는 잃는 동작이 아니고 되돌리는
 * 길도 화면에 남아 있다. 색으로 겁을 주면 해지(`CancelSubscriptionModal`)와 같은 무게로
 * 읽힌다.
 */
export function ConfirmDialog({
  label,
  title,
  description,
  detail,
  keepLabel,
  confirmLabel,
  isPending,
  onKeep,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogShell label={label} onDismiss={isPending ? undefined : onKeep}>
      {/* 제목도 `break-keep` 이다 — 320px 에서 `…취소되었습 / 니다.` 로 갈렸다. */}
      <p className="break-keep text-center text-[20px] font-medium text-ink">{title}</p>

      {/*
        ⚠️ `break-keep`(word-break: keep-all). 기본값에서 브라우저는 한글을 **글자 단위로**
        끊어서 `…유지됩니 / 다.` 처럼 낱말 가운데가 갈린다. keep-all 은 띄어쓰기에서만
        끊는다. 문구가 서버 값(플랜 이름)을 품어 길이를 미리 못 재는 자리라, 종전
        모달들처럼 `<br />` 로 손수 끊는 수를 여기서는 쓸 수 없다.
      */}
      <div className="mt-2 break-keep text-center text-[15px] leading-[22px] text-ink-muted">
        {description}
      </div>

      {detail && (
        <div className="mt-4 rounded-xl border border-line-soft bg-white py-4 text-center text-[15px] font-medium text-ink">
          {detail}
        </div>
      )}

      <div className="mt-5 flex justify-center gap-4">
        <button
          type="button"
          onClick={onKeep}
          disabled={isPending}
          className="h-[38px] w-[120px] rounded-xl bg-line-soft text-[15px] font-medium text-ink disabled:opacity-60"
        >
          {keepLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="h-[38px] w-[120px] rounded-xl bg-pictree-700 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? '처리 중...' : confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
}

type DoneDialogProps = {
  label: string;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
};

/**
 * 끝난 일을 알리는 창. 버튼 하나뿐이라 폭을 다 쓴다 — 고를 것이 없는데 120px 버튼 둘의
 * 자리에 하나만 놓이면 나머지 한 칸을 눈이 찾는다.
 *
 * **토스트가 아니라 모달인 이유**(#325 시안): 예약은 다음 결제일에야 일어나서 화면에
 * 즉각적인 변화가 없다. 3초 뒤 사라지는 줄로 알리면 "눌렀는데 아무 일도 안 일어났다" 가
 * 되고, 실제로 언제부터 바뀌는지(`description` 의 날짜)를 읽을 시간도 안 준다.
 */
export function DoneDialog({ label, title, description, onConfirm }: DoneDialogProps) {
  return (
    <DialogShell label={label} onDismiss={onConfirm}>
      {/* 제목도 `break-keep` 이다 — 320px 에서 `…취소되었습 / 니다.` 로 갈렸다. */}
      <p className="break-keep text-center text-[20px] font-medium text-ink">{title}</p>

      {/*
        ⚠️ `break-keep`(word-break: keep-all). 기본값에서 브라우저는 한글을 **글자 단위로**
        끊어서 `…유지됩니 / 다.` 처럼 낱말 가운데가 갈린다. keep-all 은 띄어쓰기에서만
        끊는다. 문구가 서버 값(플랜 이름)을 품어 길이를 미리 못 재는 자리라, 종전
        모달들처럼 `<br />` 로 손수 끊는 수를 여기서는 쓸 수 없다.
      */}
      <div className="mt-2 break-keep text-center text-[15px] leading-[22px] text-ink-muted">
        {description}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="mt-6 h-12 w-full rounded-xl bg-pictree-700 text-[15px] font-medium text-white"
      >
        확인
      </button>
    </DialogShell>
  );
}
