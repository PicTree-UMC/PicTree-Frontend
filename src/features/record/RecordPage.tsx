import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/components';
import { ROUTES } from '@/shared/constants/routes';
import { MOOD_EMOJIS } from './constants/moodEmojis';

interface RecordLocationState {
  photo?: string | null;
}

export function RecordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { photo = null } = (location.state as RecordLocationState) ?? {};

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [comment, setComment] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const handleUpload = () => {
    // TODO: API 연동 시 useMutation으로 { photo, selectedEmoji, placeName, date: today, comment } 업로드
    navigate(ROUTES.home);
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-neutral-900">장소 기록하기</h1>
      </header>

      <div className="px-4">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-pictree-100 bg-neutral-100">
          {photo ? (
            <img src={photo} alt="촬영된 사진" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              사진 없음
            </div>
          )}
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">기분 이모지</h2>
          <div className="grid grid-cols-7 gap-2">
            {MOOD_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
                  selectedEmoji === emoji ? 'bg-pictree-100 ring-2 ring-pictree-500' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">상호명</h2>
          <Input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="장소의 이름을 입력하세요"
            className="w-full"
          />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">날짜</h2>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600">
            <span>{today}</span>
            <span className="text-xs text-neutral-400">자동입력됨</span>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">한줄평</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="장소에 대한 한 줄 코멘트를 남겨주세요"
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-pictree-700"
          />
        </section>

        <Button onClick={handleUpload} className="mt-8 w-full">
          업로드
        </Button>
      </div>
    </div>
  );
}
