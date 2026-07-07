/**
 * 무료 플랜 제한 안내 배너
 * 노출 여부(plan === 'free')는 부모(TimelinePage)에서 결정.
 * 디자인 미확정: 배경/텍스트 색·모양은 확정 후 반영.
 */
export default function FreePlanBanner() {
  return (
    // TODO(디자인): 배너 배경색/모양(pill 등)/텍스트 색 적용
    <div>
      <p>무료 플랜은 최근 3일치까지 볼 수 있어요</p>
    </div>
  );
}