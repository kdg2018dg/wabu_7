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
      <div className="mb-1 flex justify-end">
        <button
          onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
          className="text-xs font-semibold text-[var(--color-ink-soft)]"
        >
          {selecting ? "취소" : "여러 개 선택해서 삭제"}
        </button>
      </div>

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
