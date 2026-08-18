import Link from "next/link";
import { Card } from "@/components/Card";
import { CATEGORY_ICON, isWeekend } from "@/lib/schedule";
import type { CalendarEvent } from "@/lib/database.types";

export function PublicMonthGrid({
  year,
  month,
  daysInMonth,
  startWeekday,
  byDate,
  noteCounts,
  today,
  selectedDate,
}: {
  year: number;
  month: number;
  daysInMonth: number;
  startWeekday: number;
  byDate: Map<string, CalendarEvent[]>;
  noteCounts: Map<string, number>;
  today: string;
  selectedDate: string;
}) {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const prevMonth = shiftMonth(monthPrefix, -1);
  const nextMonth = shiftMonth(monthPrefix, 1);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Link href={`/schedule?date=${selectedDate}&month=${prevMonth}`} className="btn-ghost !min-h-8 px-3 text-xs">
          ‹ 이전
        </Link>
        <p className="text-sm font-bold">{year}년 {month}월</p>
        <Link href={`/schedule?date=${selectedDate}&month=${nextMonth}`} className="btn-ghost !min-h-8 px-3 text-xs">
          다음 ›
        </Link>
      </div>

      <Card className="overflow-hidden p-2">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--color-ink-soft)]">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dateStr = `${monthPrefix}-${String(i + 1).padStart(2, "0")}`;
            const events = byDate.get(dateStr) ?? [];
            const noteCount = noteCounts.get(dateStr) ?? 0;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const icons = [...new Set(events.map((ev) => CATEGORY_ICON[ev.category] ?? "📌"))].slice(0, 2);
            return (
              <Link
                key={dateStr}
                href={`/schedule?date=${dateStr}&month=${monthPrefix}`}
                className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg"
                style={{
                  background: isSelected ? "var(--color-brand)" : isToday ? "var(--color-brand-soft)" : "transparent",
                  color: isSelected
                    ? "var(--color-brand-ink)"
                    : isWeekend(dateStr)
                      ? "var(--color-rose)"
                      : "var(--color-ink)",
                }}
              >
                <span className="text-xs font-semibold">{i + 1}</span>
                <span className="flex h-3.5 items-center justify-center gap-0.5 text-[10px] leading-none">
                  {icons.map((icon, idx) => (
                    <span key={idx}>{icon}</span>
                  ))}
                </span>
                {noteCount > 0 && (
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: isSelected ? "var(--color-brand-ink)" : "var(--color-mint)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function shiftMonth(monthStr: string, delta: number) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
