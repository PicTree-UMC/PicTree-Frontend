import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseButton, EmojiPicker, NavBar, Photo } from "@/shared/components";
import { useLockBodyScroll } from "@/shared/hooks/useLockBodyScroll";
import type { TimelineRecord } from "../types/timeline.types";

// ISO → "2026.04.01"
const formatDate = (iso: string): string => {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const p = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

export interface TimelineEditValues {
  title: string;
  content: string;
  /** 고른 적이 없으면 빠진다 — 안 고른 것과 빈 문자열을 서버에 같은 뜻으로 보내지 않는다. */
  mood?: string;
}

interface Props {
  record: TimelineRecord;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: TimelineEditValues) => void;
}

/** 저장(✓). 레퍼런스의 파란 원 자리 — 우리 바닥이 크림이라 GREEN-700 로 든다. */
function SaveButton({
  disabled,
  isSaving,
  onClick,
}: {
  disabled: boolean;
  isSaving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isSaving}
      aria-label={isSaving ? "저장 중" : "저장"}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-pictree-700 text-white transition-colors disabled:bg-ink-disabled"
    >
      {isSaving ? (
        // 공용 `Spinner` 를 안 쓰는 자리다 — 그쪽은 링 32px + 문구가 세로로 붙는 덩어리라
        // 40px 원 안에 안 들어가고, 색도 크림·프리미엄 바닥 기준이라 초록 면 위에서 묻힌다.
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m4 12 5 5L20 6" />
        </svg>
      )}
    </button>
  );
}

/**
 * 기록 수정 — **풀스크린이다.** 레퍼런스는 인스타그램 `정보 수정`.
 *
 * 종전엔 크림 카드 하나가 가운데 뜨는 모달이었다. 그 안에 장소명·기분·한줄평이 다 들어가야
 * 해서 입력이 45px 알약 두 개로 눌려 있었고, **가운데 정렬 입력**이라 글자를 고칠 때 커서가
 * 좌우로 흔들렸다. 무엇보다 **고치려는 그 기록의 사진이 화면에 없었다** — 여러 장을 찍은
 * 날에는 지금 어느 기록을 고치는 중인지가 장소명 글자에만 걸려 있었다.
 *
 * 풀스크린으로 오면서 사진이 맨 위에 서고, 아래는 레퍼런스의 얼개를 따른다:
 * **사진 → 그 밑에 글(장소명·한줄평) → 부가 속성(기분·날짜).** 게시물을 읽던 그 순서
 * 그대로 고치게 된다.
 *
 * **줄을 가르는 방식은 동선 만들기 ③(`RouteSavePage`)에서 가져왔다.** 입력에 테두리를
 * 두르지 않고 `border-t border-ink/10` 로 **띠 자체를** 가른다 — 알약 입력창은 '여기 칸이
 * 있다'를 말하지만, 고칠 것이 셋뿐인 화면에서는 굳이 말할 필요가 없고 윗줄 제목처럼 읽히는
 * 편이 낫다. ③ 이 고치는 값(이름)과 읽는 값(장소·날짜)을 같은 띠로 세우는 것도 그대로 따랐다.
 *
 * 입력 글자는 앱 관례대로 **15px** 이다. iOS 사파리가 16px 미만 입력에 포커스할 때 화면을
 * 확대하는 문제는 `index.html` 의 뷰포트 메타(`maximum-scale=1.0, user-scalable=no`)가 이미
 * 막고 있다 — ⚠️ **그 한 줄을 지우면 이 앱의 15px 입력이 전부 확대된다.**
 *
 * ⚠️ **레퍼런스와 다른 곳:** 거기 행은 전부 다음 화면으로 가는 길(chevron)인데, 기분은
 * 이모지 14개라 화면을 하나 더 팔 물건이 아니다. 띠 안에 그리드를 그대로 펼친다 — 접어 두면
 * 이 화면에서 고칠 수 있는 셋 중 하나가 탭 뒤로 숨는다.
 *
 * ⚠️ **× 는 고친 것을 버린다.** 종전 모달의 딤 탭·× 와 같은 동작이라 새로 생긴 위험은
 * 아니지만, 화면이 커지면서 한 번에 잃는 양이 늘었다(한줄평 500자). 확인 대화를 끼우는
 * 것은 이 화면 밖의 결정이라 그대로 뒀다.
 *
 * ⚠️ **z-[60] 이다.** 지도의 스토리 뷰어(z-50) **위에** 얹혀야 한다 — 거기서도 연필로 이
 * 화면을 연다. 토스트(z-70)는 그 위라 저장 실패 알림이 안 가린다(`TROUBLESHOOTING.md` 2).
 */
export function TimelineEditView({ record, isSaving = false, onClose, onSave }: Props) {
  const [title, setTitle] = useState(record.placeName);
  const [content, setContent] = useState(record.comment);
  // 빈 문자열은 '안 고름' 이다 — `|| null` 이라야 `EmojiPicker` 가 아무것도 안 켠다.
  const [mood, setMood] = useState<string | null>(record.mood || null);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useLockBodyScroll();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /*
   * 한줄평은 500자까지라 고정 높이로 두면 뒤가 스크롤 안으로 숨는다. 글이 자라는 만큼
   * 칸도 자라게 한다 — `height: auto` 로 되돌려야 줄일 때도 따라 줄어든다.
   *
   * 레이아웃 effect 인 이유: 브라우저가 그리기 전에 높이를 맞춰야 첫 렌더에서 한 줄이었다가
   * 늘어나는 것이 안 보인다.
   */
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const recordedDate = formatDate(record.recordedAt);
  // 제목이 비면 서버가 400 을 낸다 (title 은 필수·1자 이상)
  const isTitleEmpty = title.trim().length === 0;
  const canSave = !isTitleEmpty && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      ...(mood ? { mood } : {}),
    });
  };

  return createPortal(
    // mx-auto + sm:max-w-[390px]: 셸 컬럼과 같은 폭으로 선다. 안 주면 넓은 화면에서
    // 이 화면만 뷰포트 끝까지 퍼져 뒤에 있던 앱과 폭이 어긋난다.
    <div className="fixed inset-0 z-[60] mx-auto flex flex-col bg-cream sm:max-w-[390px]">
      <div className="shrink-0 px-5 pb-2 pt-header">
        <NavBar
          leading={<CloseButton onClick={onClose} />}
          title="기록 수정"
          action={<SaveButton disabled={!canSave} isSaving={isSaving} onClick={handleSave} />}
        />
      </div>

      {/*
        min-h-0: flex 자식은 기본 min-height 가 auto 라 이게 없으면 안 줄고 넘친다.
        가로 패딩은 여기가 아니라 **띠마다** 갖는다 — 구분선이 화면 끝까지 닿아야
        칸이 아니라 줄로 읽힌다(③ 과 같은 얼개).
      */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-10">
        {/*
          사진은 읽기 전용이다 — 이 화면에서 바꿀 수 있는 건 글과 기분뿐이다.
          w-[46%] + 3:4 는 레퍼런스 실측(390pt 폭에서 178×239pt)에서 가져왔다.
          `Photo` 가 없는 사진·만료된 presigned URL 을 같은 나무 폴백으로 흡수한다.
        */}
        <div className="flex justify-center px-5 pb-6 pt-1">
          <Photo
            src={record.thumbnailUrl}
            alt=""
            loading="eager"
            className="aspect-[3/4] w-[46%] rounded-[20px] bg-line-soft object-cover"
            iconClassName="h-10 w-10"
          />
        </div>

        {/*
          레퍼런스에서 캡션(`Blue🌟`)이 있던 자리. 사진 밑에 글이 그대로 이어지므로,
          고치는 중에도 게시물을 읽는 그림이 유지된다.

          Enter 로도 저장한다(③ 과 같다) — 장소명은 한 줄짜리라 줄바꿈을 받을 이유가 없고,
          한 손으로 고칠 때 오른쪽 위까지 손을 옮기지 않아도 된다.
        */}
        <div className="border-t border-ink/10 px-5 py-4">
          <input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={100}
            aria-label="장소명"
            aria-invalid={isTitleEmpty}
            placeholder="장소명 추가..."
            className="w-full bg-transparent text-[17px] font-medium text-ink outline-none placeholder:text-ink-disabled"
          />

          {/*
            ✓ 는 글자가 없어 잠긴 이유를 스스로 말하지 못한다(`PrimaryCta` 의 규칙이 그래서
            '버튼 글자로 이유를 말할 것' 이다). 아이콘 버튼에서는 그 말을 여기서 한다.
          */}
          {isTitleEmpty && (
            <p className="mt-1 text-[13px] text-error">장소명은 비워 둘 수 없어요.</p>
          )}
        </div>

        {/* 한줄평은 Enter 를 저장으로 안 쓴다 — 500자까지라 줄을 바꿔 쓸 수 있어야 한다. */}
        <div className="border-t border-ink/10 px-5 py-4">
          <textarea
            ref={contentRef}
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={1}
            aria-label="한줄평"
            placeholder="한줄평 추가..."
            className="w-full resize-none overflow-hidden bg-transparent text-[15px] leading-6 text-ink outline-none placeholder:text-ink-disabled"
          />
        </div>

        {/* 라벨이 13px INK-muted 인 것은 ③ 의 읽기 줄(`장소`·`날짜`)과 같은 값이다. */}
        <div className="border-t border-ink/10 px-5 py-4">
          <p className="text-[13px] text-ink-muted">기분</p>
          <div className="mt-3">
            <EmojiPicker variant="modal" selected={mood} onSelect={setMood} />
          </div>
        </div>

        {/*
          여기만 읽는 줄이다. 못 고치는 값을 누를 수 있게 두면 안 되고, 그렇다고 안 보여주면
          어느 날 기록인지 확인할 데가 없다 — 그래서 ③ 의 `dl` 꼴로 값만 세운다.
        */}
        {recordedDate && (
          <div className="border-t border-ink/10 px-5 py-4">
            <dl className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[13px] text-ink-muted">날짜</dt>
              <dd className="text-[15px] text-ink">{recordedDate}</dd>
            </dl>
            <p className="mt-1.5 text-[13px] text-ink-muted">기록한 시점 그대로 유지돼요.</p>
          </div>
        )}

        <div aria-hidden className="pb-safe" />
      </div>
    </div>,
    document.body,
  );
}
