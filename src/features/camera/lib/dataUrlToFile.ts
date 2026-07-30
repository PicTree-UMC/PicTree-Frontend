/**
 * captureFrame 이 만든 data URL(base64) 을 업로드용 File 로 변환한다.
 * 서버는 multipart 파일을 받으므로 Blob/File 형태여야 한다.
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mime });
}
