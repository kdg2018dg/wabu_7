import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { todayKST } from "@/lib/time";
import { isWeekend, CATEGORY_ICON } from "@/lib/schedule";
import type { CalendarEvent } from "@/lib/database.types";
import { NewEventForm } from "./NewEventForm";
import { MonthEventList } from "./MonthEventList";




function monthRange(monthStr: string) {
  const [y, m] = monthStr.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  return {
    firstDay: first.toISOString().slice(0, 10),
    lastDay: last.toISOString().slice(0, 10),
    daysInMonth: last.getUTCDate(),
    startWeekday: first.getUTCDay(),
    y,
    m,
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const currentMonth = month || todayKST().slice(0, 7);
  const { firstDay, lastDay, daysInMonth, startWeekday, y, m } = monthRange(currentMonth);

  const supabase = await createClient();
  const { data } = (await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", firstDay)
    .lte("event_date", lastDay)
    .order("event_date", { ascending: true })) as { data: CalendarEvent[] | null };

  const events = data ?? [];
  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    if (!byDate.has(ev.event_date)) byDate.set(ev.event_date, []);
    byDate.get(ev.event_date)!.push(ev);
  }

  const prevMonth = shiftMonth(currentMonth, -1);
  const nextMonth = shiftMonth(currentMonth, 1);
  const today = todayKST();

  return (
    <div>
      <PageHeader title="학급 캘린더" subtitle="날짜를 눌러 교시별 일정과 메모를 확인·수정하세요" compact />

      <div className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <Link href={`/calendar?month=${prevMonth}`} className="btn-ghost px-4">‹ 이전</Link>
          {currentMonth === today.slice(0, 7) ? (
            <p className="text-sm font-bold">{y}년 {m}월</p>
          ) : (
            <Link href={`/calendar?month=${today.slice(0, 7)}`} className="text-sm font-bold text-[var(--color-brand)]">
              {y}년 {m}월 · 오늘로 이동
            </Link>
          )}
          <Link href={`/calendar?month=${nextMonth}`} className="btn-ghost px-4">다음 ›</Link>
        </div>
        <Link href="/timetable" className="mb-3 block text-center text-xs font-semibold text-[var(--color-brand)]">
          내 시간표 보기/수정 →
        </Link>

        {/* PC: 월간 그리드 */}
        <Card className="mb-5 hidden overflow-hidden p-3 md:block">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--color-ink-soft)]">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dateStr = `${currentMonth}-${String(i + 1).padStart(2, "0")}`;
              const dayEvents = byDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              const weekend = isWeekend(dateStr);
              return (
                <Link
                  key={dateStr}
                  href={`/calendar/${dateStr}`}
                  className="min-h-20 rounded-lg border border-[var(--color-line)] p-1.5 transition hover:border-[var(--color-brand)]"
                  style={{
                    borderColor: isToday ? "var(--color-brand)" : undefined,
                    borderWidth: isToday ? 2 : undefined,
                    background: weekend ? "var(--color-canvas)" : undefined,
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={weekend ? { color: "var(--color-rose)" } : undefined}
                  >
                    {i + 1}
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{
                          background: ev.color ? `${ev.color}22` : "var(--color-brand-soft)",
                          color: ev.color ?? "var(--color-brand)",
                        }}
                      >
                        {CATEGORY_ICON[ev.category] ?? "📌"} {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-[var(--color-ink-soft)]">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* 모바일: 날짜별 리스트 (일정 있는 날만, 여러 개 선택 삭제 가능) */}
        <MonthEventList
          days={Array.from({ length: daysInMonth }).map((_, i) => {
            const dateStr = `${currentMonth}-${String(i + 1).padStart(2, "0")}`;
            return { dateStr, weekend: isWeekend(dateStr), events: byDate.get(dateStr) ?? [] };
          })}
          today={today}
        />

        <div className="mt-5">
          <p className="mb-2 px-1 text-sm font-bold">이번 달 일정 추가</p>
          <NewEventForm defaultDate={today} />
        </div>
      </div>
    </div>
  );
}

function shiftMonth(monthStr: string, delta: number) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
