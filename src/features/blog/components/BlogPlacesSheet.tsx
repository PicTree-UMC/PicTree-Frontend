import { Sheet } from '@/shared/components';
import type { BlogSection } from '../types/blog';

type BlogPlacesSheetProps = {
  sections: BlogSection[];
  onClose: () => void;
};

export function BlogPlacesSheet({ sections, onClose }: BlogPlacesSheetProps) {
  return (
    // 등장 애니메이션은 원래 없다 — 여기서 붙이면 이 시트만 다른 시트와 다르게 뜬다.
    <Sheet
      onClose={onClose}
      label="방문한 장소"
      handleColor="rgba(0,0,0,0.7)"
      animateIn={false}
      z={60}
      className="rounded-t-[22px] bg-[#fffcef]"
      contentClassName="px-5"
      bottomPadding="1.5rem"
    >
      <h2 className="text-[17px] font-bold text-[#2c3930]">
        방문한 장소 <span className="text-pictree-700">{sections.length}곳</span>
      </h2>

      <ul className="mt-3 max-h-[64vh] overflow-y-auto">
        {sections.map((section) => (
          <li
            key={section.treeId}
            className="flex items-center gap-3 border-b border-[#ececdf] py-3 last:border-0"
          >
            <img
              src={section.image}
              alt=""
              className="h-[56px] w-[56px] shrink-0 rounded-lg object-cover"
            />
            <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#2c3930]">
              {section.heading}
            </p>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
