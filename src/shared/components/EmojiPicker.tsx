import { MOOD_EMOJIS } from '@/shared/constants/moodEmojis';

type EmojiPickerVariant = 'grid' | 'row' | 'modal';

interface EmojiPickerProps {
  selected: string | null;
  onSelect: (emoji: string) => void;
  /**
   * grid: 촬영 폼용 7열 그리드(어두운 배경)
   * row: 캡션용 가로 스크롤
   * modal: 밝은 배경용 7열 그리드 — 기록 수정 화면(`TimelineEditView`)의 흰 카드 안
   */
  variant: EmojiPickerVariant;
}

/** 기분 이모지 선택기. 촬영 폼·캡션·기록 수정 모달에서 재사용. */
export function EmojiPicker({ selected, onSelect, variant }: EmojiPickerProps) {
  const container =
    variant === 'grid'
      ? 'grid grid-cols-7 gap-2'
      : variant === 'modal'
        ? 'grid grid-cols-7 gap-x-[10px] gap-y-2'
        : 'flex gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2';

  const size =
    variant === 'row' ? 'h-10 w-10' : variant === 'modal' ? 'h-8 w-8' : 'h-9 w-9';

  // 시안의 모달은 이모지만 늘어놓고 칩 배경이 없다. 선택된 것만 옅게 강조한다.
  const unselected =
    variant === 'grid' ? 'bg-neutral-800' : variant === 'modal' ? '' : 'bg-black/40';
  const selectedStyle =
    variant === 'modal' ? 'bg-pictree-300 ring-2 ring-pictree-500' : 'bg-white/90';
  const fontSize = variant === 'modal' ? 'text-[22px]' : 'text-lg';

  return (
    <div className={container}>
      {MOOD_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-pressed={selected === emoji}
          onClick={() => onSelect(emoji)}
          className={`flex ${size} shrink-0 items-center justify-center rounded-full ${fontSize} transition ${
            selected === emoji ? selectedStyle : unselected
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
