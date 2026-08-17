"use client";

import { useState } from "react";
import { useRankingsQuery } from "@/lib/queries/rankings";
import { formatMinutes, todayKST } from "@/lib/time";
import { Card, Pill } from "@/components/Card";

const MEDAL = ["🥇", "🥈", "🥉"];

function shiftWeek(dateStr: string, deltaDays: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function RankingsClient({ userId }: { userId: string }) {
  const [referenceDate, setReferenceDate] = useState(todayKST());
  const { data, isLoading, isError } = useRankingsQuery(referenceDate);
  const isCurrentWeek = referenceDate === todayKST();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonCard height={70} />
        <SkeletonCard height={280} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
        랭킹을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </Card>
    );
  }

  const { rows, classTotal, weekStart, weekEnd } = data;

  return (
    <>
      <div className="mb-2 -mt-1 flex items-center justify-between">
        <button
          onClick={() => setReferenceDate((d) => shiftWeek(d, -7))}
          className="btn-ghost !min-h-8 px-3 text-xs"
        >
          ‹ 지난주
        </button>
        <p className="text-xs text-[var(--color-ink-soft)]">
          {weekStart} ~ {weekEnd} {isCurrentWeek && "· 이번 주"}
        </p>
        <button
          onClick={() => setReferenceDate((d) => shiftWeek(d, 7))}
          disabled={isCurrentWeek}
          className="btn-ghost !min-h-8 px-3 text-xs disabled:opacity-40"
        >
          다음주 ›
        </button>
      </div>
      <Card className="mb-4 p-4">
        <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 우리 반 총 공부시간</p>
        <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(classTotal)}</p>
      </Card>

      <Card className="divide-y divide-[var(--color-line)]">
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-soft)]">
            아직 승인된 공부시간이 없어요.
          </p>
        )}
        {rows.map((r) => {
          const isMe = r.user_id === userId;
          return (
            <div
              key={r.user_id}
              className="flex items-center gap-3 px-4 py-3"
              style={isMe ? { background: "var(--color-brand-soft)" } : undefined}
            >
              <span className="w-7 text-center text-sm font-bold text-[var(--color-ink-soft)]">
                {r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}
              </span>
              <p className="flex min-w-0 flex-1 items-center gap-2 truncate text-sm font-semibold">
                <span className="truncate">{r.displayName}</span>
                {isMe && <Pill tone="brand">나</Pill>}
              </p>
              <p className="stat-figure text-sm font-bold">{formatMinutes(r.totalMinutes)}</p>
            </div>
          );
        })}
      </Card>

      <p className="mt-4 px-1 text-center text-xs text-[var(--color-ink-soft)]">
        승인된 공부시간만 랭킹에 반영돼요. 우리 함께 성장해요 :)
      </p>
    </>
  );
}

function SkeletonCard({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-[var(--radius-card)] bg-[var(--color-line)]/50"
      style={{ height }}
    />
  );
}
