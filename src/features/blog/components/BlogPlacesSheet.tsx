import { createPortal } from 'react-dom';
import type { BlogSection } from '../types/blog';

type BlogPlacesSheetProps = {
  sections: BlogSection[];
  onClose: () => void;
};

export function BlogPlacesSheet({ sections, onClose }: BlogPlacesSheetProps) {
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50" role="presentation" onClick={onClose}>
      <section
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full flex-col rounded-t-[22px] bg-[#fffcef] px-5 pb-6 pt-8 sm:max-w-[390px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-places-title"
        onClick={(event) => event.stopPropagation()}
      >
        <i className="absolute left-1/2 top-2 h-1 w-[132px] -translate-x-1/2 rounded-full bg-black/70" aria-hidden />
        <h2 id="blog-places-title" className="text-[17px] font-bold text-[#2c3930]">
          방문한 장소 <span className="text-[#5b6b38]">{sections.length}곳</span>
        </h2>

        <ul className="mt-3 max-h-[64vh] overflow-y-auto">
          {sections.map((section) => (
            <li key={section.treeId} className="flex items-center gap-3 border-b border-[#ececdf] py-3 last:border-0">
              <img src={section.image} alt="" className="h-[56px] w-[56px] shrink-0 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#2c3930]">{section.heading}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>,
    document.body,
  );
}
