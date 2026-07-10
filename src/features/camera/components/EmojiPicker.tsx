import { MOOD_EMOJIS } from '@/shared/constants/moodEmojis';

type EmojiPickerVariant = 'grid' | 'row';

interface EmojiPickerProps {
  selected: string | null;
  onSelect: (emoji: string) => void;
  /** grid: 작성 폼용 7열 그리드 / row: 캡션용 가로 스크롤 */
  variant: EmojiPickerVariant;
}

/** 기분 이모지 선택기. 작성 폼(grid)과 캡션(row) 두 곳에서 재사용. */
export function EmojiPicker({ selected, onSelect, variant }: EmojiPickerProps) {
  const container =
    variant === 'grid'
      ? 'grid grid-cols-7 gap-2'
      : 'flex gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2';
  const size = variant === 'grid' ? 'h-9 w-9' : 'h-10 w-10';
  const unselected = variant === 'grid' ? 'bg-neutral-800' : 'bg-black/40';

  return (
    <div className={container}>
      {MOOD_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`flex ${size} shrink-0 items-center justify-center rounded-full text-lg transition ${
            selected === emoji ? 'bg-white/90' : unselected
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
