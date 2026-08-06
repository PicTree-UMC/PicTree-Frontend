import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/shared/constants/routes";
import { useToast } from "@/shared/components";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import treeIcon from "./assets/icons/tree.svg";
import trashIcon from "./assets/icons/trash.svg";
import {
  useDeleteNearbyAlertLogs,
  useNearbyAlertLogs,
  useOpenNearbyAlertLog,
} from "./hooks/useNearbyAlerts";
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
  /** 선택 모드에서는 누르면 지도로 가지 않고 체크만 토글한다. */
  selecting: boolean;
  checked: boolean;
  onOpen: (log: NearbyAlertLog) => void;
  onToggle: (alertLogId: number) => void;
}

function AlertLogRow({ log, selecting, checked, onOpen, onToggle }: RowProps) {
  const sentAt = formatSentAt(log.sentAt);
  const badge = STATUS[log.status];
  const isUnread = log.openedAt === null;

  return (
    <button
      type="button"
      onClick={() => (selecting ? onToggle(log.alertLogId) : onOpen(log))}
      aria-pressed={selecting ? checked : undefined}
      className="flex w-full items-center gap-3 py-3.5 text-left"
    >
      {selecting ? (
        <span
          aria-hidden
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
            checked ? "border-[#5B6B38] bg-[#5B6B38]" : "border-[#C5D89D] bg-white"
          }`}
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#FFFCEF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l5 5 9-10" />
            </svg>
          )}
        </span>
      ) : (
        /*
          나무 기본 이미지(defaultImage)는 "DEFAULT_1" 같은 식별자라 URL 이 아니다.
          여기서는 공통 나무 아이콘으로 둔다.
        */
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F6F0D7]">
          <img src={treeIcon} alt="" className="h-6 w-6" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {/* 안 읽은 알림에 점을 찍는다 — 목록에서 새 것만 눈에 들어오게. */}
          {isUnread && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#DC2626]" aria-label="확인 안 함" />
          )}
          <p className="min-w-0 truncate text-[15px] text-[#2C3930]">{log.treeName}</p>
          {badge && (
            <span className={`flex-shrink-0 rounded-lg px-1.5 py-0.5 text-[13px] ${badge.className}`}>
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
 *
 * 삭제(`DELETE /nearby-alerts/logs/{id}`)는 서버가 소프트 삭제한다. 예전에는 이 API 가
 * 없어서 지운 id 를 브라우저에 적어 두고 감췄는데(기기마다 결과가 달랐다), 이제는
 * 어느 기기에서 봐도 지워진 상태다.
 *
 * ⚠️ 일괄 삭제 엔드포인트는 없다 — 선택 삭제·모두 삭제는 건수만큼 요청이 나간다.
 */
export function AlertLogsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, isPending, isError, refetch } = useNearbyAlertLogs();
  const { mutate: markOpened } = useOpenNearbyAlertLog();
  const { mutate: deleteLogs, isPending: isDeleting } = useDeleteNearbyAlertLogs();

  const [selecting, setSelecting] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  /** 'all' 은 모두 삭제, 숫자는 선택 삭제 개수. null 이면 확인창이 닫혀 있다. */
  const [confirming, setConfirming] = useState<"all" | "selected" | null>(null);

  const logs = data?.items ?? [];

  const handleOpen = (log: NearbyAlertLog) => {
    // 이미 확인한 기록은 다시 부르지 않는다 — 서버 값이 바뀌지 않는다.
    if (log.openedAt === null) {
      markOpened(log.alertLogId);
    }

    navigate(ROUTES.home);
  };

  const toggle = (alertLogId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(alertLogId)) next.delete(alertLogId);
      else next.add(alertLogId);
      return next;
    });
  };

  const exitSelecting = () => {
    setSelecting(false);
    setChecked(new Set());
  };

  /**
   * 실제로 지워진 건수로 문구를 만든다. 일부만 성공할 수 있어서다 — 이미 지워진
   * 기록(404)이 섞이면 서버는 그 건만 거절하고 나머지는 지운다.
   */
  const remove = (ids: number[]) => {
    deleteLogs(ids, {
      onSuccess: ({ deletedIds, failedCount }) => {
        exitSelecting();
        setConfirming(null);

        if (deletedIds.length === 0) {
          showToast("알림을 지우지 못했어요.", "error");
          return;
        }

        showToast(
          failedCount > 0
            ? `${deletedIds.length}개를 지웠어요. ${failedCount}개는 실패했어요.`
            : `알림 ${deletedIds.length}개를 지웠어요.`,
          failedCount > 0 ? "error" : "success",
        );
      },
      onError: () => {
        setConfirming(null);
        showToast("알림을 지우지 못했어요.", "error");
      },
    });
  };

  const allChecked = logs.length > 0 && checked.size === logs.length;

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="bg-[#C5D89D] px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (selecting ? exitSelecting() : navigate(-1))}
            aria-label={selecting ? "선택 취소" : "뒤로 가기"}
            className="flex h-6 w-6 items-center justify-center"
          >
            {selecting ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#2C3930" strokeWidth={2} strokeLinecap="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
            )}
          </button>
          <h1 className="flex-1 text-[20px] font-medium text-black">
            {selecting ? `${checked.size}개 선택` : "알림 기록"}
          </h1>

          {logs.length > 0 &&
            (selecting ? (
              <button
                type="button"
                onClick={() => setChecked(allChecked ? new Set() : new Set(logs.map((l) => l.alertLogId)))}
                className="text-[14px] text-[#2C3930]"
              >
                {allChecked ? "선택 해제" : "전체 선택"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelecting(true)}
                className="text-[14px] text-[#2C3930]"
              >
                선택
              </button>
            ))}
        </div>
        <p className="mt-2 text-[13px] text-[#2C3930]">
          {selecting ? "지울 알림을 골라주세요" : "근처 나무 알림으로 받은 기록이에요"}
        </p>
      </header>

      <div className="px-5 pt-5">
        {isPending ? (
          <p className="py-10 text-center text-[14px] text-[#60655C]">불러오는 중...</p>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-[14px] text-[#DC2626]">알림 기록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : logs.length === 0 ? (
          /*
            알림을 아직 못 받은 상태다. 왜 비어 있는지 알려 줘야 사용자가
            "고장났나" 하지 않는다. 지워서 비었을 때도 같은 문구다 — 서버에서
            지워진 것이라 되살릴 방법이 없다.
          */
          <div className="py-10 text-center">
            <p className="text-[14px] text-[#60655C]">아직 받은 알림이 없어요.</p>
            <p className="mt-1 text-[13px] text-[#60655C]">
              기록해 둔 장소 근처에 가면 알려드릴게요.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border-2 border-[#C5D89D] bg-white px-5 py-1">
              {logs.map((log) => (
                <AlertLogRow
                  key={log.alertLogId}
                  log={log}
                  selecting={selecting}
                  checked={checked.has(log.alertLogId)}
                  onOpen={handleOpen}
                  onToggle={toggle}
                />
              ))}
            </div>

            {!selecting && (
              <button
                type="button"
                onClick={() => setConfirming("all")}
                className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[14px] text-[#60655C]"
              >
                <img src={trashIcon} alt="" className="h-4 w-4" />
                알림 기록 모두 지우기
              </button>
            )}

          </>
        )}
      </div>

      {/* 선택 삭제 바 — 고른 게 있을 때만 뜬다. */}
      {selecting && checked.size > 0 && (
        <div className="bottom-nav fixed inset-x-0 z-30 mx-auto px-5 sm:max-w-[390px]">
          <button
            type="button"
            onClick={() => setConfirming("selected")}
            className="flex h-[46px] w-full items-center justify-center gap-1.5 rounded-[24px] bg-[#DC2626] text-[15px] font-medium text-white"
          >
            {checked.size}개 지우기
          </button>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
          onClick={() => setConfirming(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[300px] rounded-2xl bg-white px-5 py-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[15px] font-medium text-[#2C3930]">
              {confirming === "all"
                ? "알림 기록을 모두 지울까요?"
                : `선택한 ${checked.size}개를 지울까요?`}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#60655C]">
              지운 알림은 되돌릴 수 없어요.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={isDeleting}
                className="h-[44px] flex-1 rounded-xl bg-[#F1F1F1] text-[15px] text-[#2C3930] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() =>
                  remove(
                    confirming === "all" ? logs.map((log) => log.alertLogId) : [...checked],
                  )
                }
                disabled={isDeleting}
                className="h-[44px] flex-1 rounded-xl bg-[#DC2626] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {isDeleting ? "지우는 중" : "지우기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
