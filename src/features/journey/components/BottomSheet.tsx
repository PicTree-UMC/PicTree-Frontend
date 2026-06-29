import { Journey } from '../types/journey';

interface BottomSheetProps {
  journey: Journey;
  onClose: () => void;
  onMapView: () => void;
  onPhotoGallery: () => void;
  onAIBlog: () => void;
  onRename: () => void;
}

export function BottomSheet({
  journey,
  onClose,
  onMapView,
  onPhotoGallery,
  onAIBlog,
  onRename,
}: BottomSheetProps) {
  return (
    <>
      {/* 배경 딤드 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          {journey.title}
        </h2>

        <div className="flex flex-col">
          <button
            onClick={onMapView}
            className="py-4 text-left text-sm text-gray-700 border-b border-gray-100"
          >
            지도에서 보기
          </button>
          <button
            onClick={onPhotoGallery}
            className="py-4 text-left text-sm text-gray-700 border-b border-gray-100"
          >
            사진 갤러리
          </button>
          <button
            onClick={onAIBlog}
            className="py-4 text-left text-sm text-gray-700 border-b border-gray-100"
          >
            AI 블로그 작성
          </button>
          <button
            onClick={onRename}
            className="py-4 text-left text-sm text-gray-700"
          >
            이름 변경
          </button>
        </div>
      </div>
    </>
  );
}