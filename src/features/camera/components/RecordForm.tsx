import { EmojiPicker } from './EmojiPicker';

interface RecordFormProps {
  selectedEmoji: string | null;
  onSelectEmoji: (emoji: string) => void;
  placeName: string;
  onPlaceNameChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

/** 작성 모드(사진 없이 기록하기) 본문 폼. 각 섹션이 순차 등장한다. */
export function RecordForm({
  selectedEmoji,
  onSelectEmoji,
  placeName,
  onPlaceNameChange,
  comment,
  onCommentChange,
}: RecordFormProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div className="animate-fade-in-up">
        <h2 className="mb-2 text-sm font-semibold text-white">기분 이모지</h2>
        <EmojiPicker variant="grid" selected={selectedEmoji} onSelect={onSelectEmoji} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '70ms' }}>
        <h2 className="mb-2 mt-5 text-sm font-semibold text-white">상호명</h2>
        <input
          value={placeName}
          onChange={(e) => onPlaceNameChange(e.target.value)}
          placeholder="장소의 이름을 입력하세요"
          className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/50"
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <h2 className="mb-2 mt-5 text-sm font-semibold text-white">한줄평</h2>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="장소에 대한 한 줄 코멘트를 남겨주세요"
          rows={3}
          className="w-full resize-none rounded-lg bg-neutral-800 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/50"
        />
      </div>
    </div>
  );
}
