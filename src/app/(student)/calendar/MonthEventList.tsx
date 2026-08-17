"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, Pill } from "@/components/Card";
import { CATEGORY_LABEL, CATEGORY_ICON } from "@/lib/schedule";
import { formatDateKorean } from "@/lib/time";
import { deleteEvents } from "./actions";
import type { CalendarEvent } from "@/lib/database.types";

export function MonthEventList({
  days,
  today,
}: {
  days: { dateStr: string; weekend: boolean; events: CalendarEvent[] }[];
  today: string;
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-2 md:hidden">
      {/* 미니 월간 그리드 — 일정이 없는 날짜도 눌러서 교시별 안내사항을 볼 수 있다 */}
      <Card className="mb-2 overflow-hidden p-2">
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ dateStr, weekend, events }) => {
            const dayNum = Number(dateStr.slice(-2));
            const isToday = dateStr === today;
            return (
              <Link
                key={dateStr}
                href={`/calendar/${dateStr}`}
                className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg"
                style={{
                  background: isToday ? "var(--color-brand)" : "transparent",
                  color: isToday ? "var(--color-brand-ink)" : weekend ? "var(--color-rose)" : "var(--color-ink)",
                }}
              >
                <span className="text-xs font-semibold">{dayNum}</span>
                {events.length > 0 && (
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: isToday ? "var(--color-brand-ink)" : "var(--color-brand)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--color-ink-soft)]">일정 있는 날</p>
        <button
          onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
          className="text-xs font-semibold text-[var(--color-ink-soft)]"
        >
          {selecting ? "취소" : "여러 개 선택해서 삭제"}
        </button>
      </div>

      {days.every((d) => d.events.length === 0 && d.dateStr !== today) && (
        <Card className="p-4 text-center text-sm text-[var(--color-ink-soft)]">
          이번 달 등록된 일정이 없어요. 위 달력에서 날짜를 눌러 교시별 안내사항을 추가해보세요.
        </Card>
      )}

      {days.map(({ dateStr, weekend, events }) => {
        if (events.length === 0 && dateStr !== today) return null;

        const content = (
          <Card className="p-3">
            <p
              className="text-sm font-bold"
              style={dateStr === today ? { color: "var(--color-brand)" } : weekend ? { color: "var(--color-rose)" } : undefined}
            >
              {formatDateKorean(dateStr)} {dateStr === today && "· 오늘"}
            </p>
            {events.length > 0 ? (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {events.map((ev) =>
                  selecting ? (
                    <label key={ev.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(ev.id)}
                        onChange={() => toggle(ev.id)}
                        className="h-4 w-4"
                      />
                      <Pill tone={ev.priority === "high" ? "rose" : "muted"}>
                        {CATEGORY_ICON[ev.category] ?? "📌"} {CATEGORY_LABEL[ev.category] ?? ev.category} · {ev.title}
                      </Pill>
                    </label>
                  ) : (
                    <Pill key={ev.id} tone={ev.priority === "high" ? "rose" : "muted"}>
                      {CATEGORY_ICON[ev.category] ?? "📌"} {CATEGORY_LABEL[ev.category] ?? ev.category} · {ev.title}
                    </Pill>
                  )
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">일정 없음 · 눌러서 교시별 일정 보기</p>
            )}
          </Card>
        );

        return selecting ? (
          <div key={dateStr}>{content}</div>
        ) : (
          <Link key={dateStr} href={`/calendar/${dateStr}`}>
            {content}
          </Link>
        );
      })}

      {selecting && selected.size > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2">
          <button
            disabled={pending}
            onClick={() => {
              if (confirm(`선택한 일정 ${selected.size}개를 삭제할까요?`)) {
                startTransition(async () => {
                  await deleteEvents([...selected]);
                  exitSelecting();
                });
              }
            }}
            className="btn-primary px-6"
            style={{ background: "var(--color-rose)" }}
          >
            {pending ? "삭제 중..." : `선택한 ${selected.size}개 삭제`}
          </button>
        </div>
      )}
    </div>
  );
}
