/**
 * video 프레임을 캡처한다.
 * 1) targetAspect(화면에 보이는 비율)에 맞춰 object-cover와 동일하게 중앙 크롭
 * 2) 그 안에서 zoom 배율만큼 추가로 중앙 크롭 (디지털 줌)
 * 3) mirror가 true면 좌우 반전 (전면 카메라 미리보기와 결과물을 일치시킴)
 */
export function captureFrame(
  video: HTMLVideoElement,
  zoom: number,
  targetAspect: number,
  mirror: boolean,
): string {
  const videoAspect = video.videoWidth / video.videoHeight;

  let coverWidth = video.videoWidth;
  let coverHeight = video.videoHeight;
  if (videoAspect > targetAspect) {
    coverWidth = video.videoHeight * targetAspect;
  } else {
    coverHeight = video.videoWidth / targetAspect;
  }
  const coverX = (video.videoWidth - coverWidth) / 2;
  const coverY = (video.videoHeight - coverHeight) / 2;

  const sw = coverWidth / zoom;
  const sh = coverHeight / zoom;
  const sx = coverX + (coverWidth - sw) / 2;
  const sy = coverY + (coverHeight - sh) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
