const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * byte 를 사람이 읽는 크기로. 서버가 사진 크기를 byte(`fileSize`)로 주기 때문에
 * 화면에 그대로 쓸 수 없다.
 *
 * 1024 단위로 올리고, MB 이상은 소수점을 버린다 ("50MB"). KB 이하만
 * 소수 한 자리를 남긴다 — 작은 값에서 전부 "0MB" 로 뭉개지지 않게.
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0MB";
  }

  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = unit >= 2 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded}${UNITS[unit]}`;
};
