import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/shared/constants/routes";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import treeIcon from "./assets/icons/tree.svg";
import { useNearbyAlertLogs, useOpenNearbyAlertLog } from "./hooks/useNearbyAlerts";
import type { NearbyAlertLog, NearbyAlertStatus } from "./types/nearbyAlert";

/** ISO → "7월 25일 14:30". 값이 없으면 표시하지 않는다. */
const formatSentAt = (iso: string | null): string | null => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
};

/**
 * 상태 배지. 발송 실패는 사용자가 알아야 한다 — 알림이 안 온 게 버그가 아니라
 * 기기 쪽 문제일 수 있어서다.
 */
const STATUS: Record<NearbyAlertStatus, { label: string; className: string } | null> = {
  // 발송된 것과 확인한 것은 굳이 배지를 달지 않는다. 목록 대부분이 이 상태다.
  SENT: null,
  OPENED: null,
  PENDING: { label: "발송 대기", className: "bg-[#F6F0D7] text-[#60655C]" },
  FAILED: { label: "발송 실패", className: "bg-[#FDE7E7] text-[#DC2626]" },
};

interface RowProps {
  log: NearbyAlertLog;
  onOpen: (log: NearbyAlertLog) => void;
}

function AlertLogRow({ log, onOpen }: RowProps) {
  const sentAt = formatSentAt(log.sentAt);
  const badge = STATUS[log.status];
  const isUnread = log.openedAt === null;

  return (
    <button
      type="button"
      onClick={() => onOpen(log)}
      className="flex w-full items-center gap-3 py-3.5 text-left"
    >
      {/*
        나무 기본 이미지(defaultImage)는 "DEFAULT_1" 같은 식별자라 URL 이 아니다.
        여기서는 공통 나무 아이콘으로 둔다.
      */}
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F6F0D7]">
        <img src={treeIcon} alt="" className="h-6 w-6" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {/* 안 읽은 알림에 점을 찍는다 — 목록에서 새 것만 눈에 들어오게. */}
          {isUnread && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#DC2626]" aria-label="확인 안 함" />
          )}
          <p className="min-w-0 truncate text-[15px] text-[#2C3930]">{log.treeName}</p>
          {badge && (
            <span className={`flex-shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] text-[#60655C]">
          약 {log.distanceM}m{sentAt ? ` · ${sentAt}` : ""}
        </p>
      </div>
    </button>
  );
}

/**
 * 근처 나무 알림 기록. `GET /nearby-alerts/logs`
 *
 * 푸시를 놓쳤거나 지웠을 때 여기서 다시 확인한다. 항목을 누르면 확인 처리
 * (`PATCH /nearby-alerts/logs/{id}/open`)가 나가고 지도로 이동해 그 나무를 연다.
 */
export function AlertLogsPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useNearbyAlertLogs();
  const { mutate: markOpened } = useOpenNearbyAlertLog();

  const logs = data?.items ?? [];

  const handleOpen = (log: NearbyAlertLog) => {
    // 이미 확인한 기록은 다시 부르지 않는다 — 서버 값이 바뀌지 않는다.
    if (log.openedAt === null) {
      markOpened(log.alertLogId);
    }

    navigate(ROUTES.home);
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="bg-[#C5D89D] px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-xl font-bold text-black">알림 기록</h1>
        </div>
        <p className="mt-2 text-[13px] text-[#2C3930]">
          근처 나무 알림으로 받은 기록이에요
        </p>
      </header>

      <div className="px-5 pt-5">
        {isPending ? (
          <p className="py-10 text-center text-sm text-[#60655C]">불러오는 중...</p>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#DC2626]">알림 기록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 text-xs font-bold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : logs.length === 0 ? (
          /*
            알림을 아직 못 받은 상태다. 왜 비어 있는지 알려 줘야 사용자가
            "고장났나" 하지 않는다.
          */
          <div className="py-10 text-center">
            <p className="text-sm text-[#60655C]">아직 받은 알림이 없어요.</p>
            <p className="mt-1 text-[13px] text-[#60655C]">
              기록해 둔 장소 근처에 가면 알려드릴게요.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-1">
            {logs.map((log) => (
              <AlertLogRow key={log.alertLogId} log={log} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
