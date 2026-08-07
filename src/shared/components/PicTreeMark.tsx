/**
 * `className` 을 넘기면 기본 크기(100×119px)를 통째로 갈아끼운다 — 크기를 바꿔야 하는
 * 쪽(프리미엄 히어로)이 있어 열어 뒀다. 안 넘기면 종전과 같다.
 */
export function PicTreeMark({ className }: { className?: string }) {
  return (
    <img
      alt="PicTree"
      className={className ?? 'h-[7.4375rem] w-[6.25rem] object-contain'}
      src="/assets/PicTreeLogo.svg"
    />
  );
}
