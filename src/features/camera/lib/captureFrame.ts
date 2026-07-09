/** video 프레임을 zoom 배율만큼 중앙 크롭해서 캡처 (디지털 줌). */
export function captureFrame(video: HTMLVideoElement, zoom: number): string {
  const canvas = document.createElement('canvas');
  const sw = video.videoWidth / zoom;
  const sh = video.videoHeight / zoom;
  const sx = (video.videoWidth - sw) / 2;
  const sy = (video.videoHeight - sh) / 2;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.92);
}
