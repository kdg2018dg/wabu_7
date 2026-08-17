import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAY_LABEL, PERIODS, isWeekend, CATEGORY_LABEL, CATEGORY_ICON } from "@/lib/schedule";
import { todayKST, formatDateKorean } from "@/lib/time";
import { Logo7 } from "@/components/Logo7";
import { Card, Pill } from "@/components/Card";
import type { CalendarEvent } from "@/lib/database.types";
import type { TimetableRow } from "@/lib/schedule";

export default async function PublicSchedulePage() {
  const supabase = await createClient();
  const today = todayKST();
  const monthPrefix = today.slice(0, 7);

  const [{ data: template }, { data: events }] = await Promise.all([
    supabase.from("timetable_template").select("*").order("period") as unknown as Promise<{
      data: TimetableRow[] | null;
    }>,
    supabase
      .from("calendar_events")
      .select("*")
      .gte("event_date", `${monthPrefix}-01`)
      .lte("event_date", `${monthPrefix}-31`)
      .order("event_date") as unknown as Promise<{ data: CalendarEvent[] | null }>,
  ]);

  const templateMap = new Map((template ?? []).map((t) => [`${t.day_of_week}-${t.period}`, t]));
  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of events ?? []) {
    if (!byDate.has(ev.event_date)) byDate.set(ev.event_date, []);
    byDate.get(ev.event_date)!.push(ev);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo7 size={22} />
          <div>
            <h1 className="text-lg font-bold">7반 학급 시간표 · 일정</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">로그인 없이 볼 수 있는 공개 화면이에요</p>
          </div>
        </div>
        <Link href="/login" className="btn-primary px-4 !min-h-10 text-sm">
          로그인
        </Link>
      </header>

      <section>
        <p className="mb-2 text-sm font-bold">기본 시간표</p>
        <p className="mb-2 text-xs text-[var(--color-ink-soft)] md:hidden">
          👉 옆으로 스크롤해서 전체 시간표를 확인하세요
        </p>
        <Card className="overflow-x-auto p-3">
          <div className="grid min-w-[520px] grid-cols-[36px_repeat(5,1fr)] gap-1.5">
            <div />
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className="py-1 text-center text-xs font-bold text-[var(--color-ink-soft)]">
                {WEEKDAY_LABEL[d]}
              </div>
            ))}
            {PERIODS.map((period) => (
              <div key={`row-${period}`} className="contents">
                <div className="flex items-center justify-center text-xs font-bold text-[var(--color-ink-soft)]">
                  {period}
                </div>
                {[1, 2, 3, 4, 5].map((d) => {
                  const cell = templateMap.get(`${d}-${period}`);
                  return (
                    <div key={`${d}-${period}`} className="rounded-lg bg-[var(--color-canvas)] p-1.5">
                      {cell?.subject ? (
                        <>
                          <p className="truncate text-[11px] font-semibold">{cell.subject}</p>
                          <p className="truncate text-[10px] text-[var(--color-ink-soft)]">{cell.teacher}</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-[var(--color-ink-soft)]">-</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
          로그인하면 개인별로 다르게 커스터마이즈할 수 있어요.
        </p>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold">이번 달 일정</p>
        <div className="flex flex-col gap-2">
          {[...byDate.entries()].length === 0 && (
            <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">등록된 일정이 없어요.</Card>
          )}
          {[...byDate.entries()].map(([date, dayEvents]) => (
            <Card key={date} className="p-3">
              <p
                className="mb-1 text-xs font-bold"
                style={isWeekend(date) ? { color: "var(--color-rose)" } : undefined}
              >
                {formatDateKorean(date)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dayEvents.map((ev) => (
                  <Pill key={ev.id} tone={ev.priority === "high" ? "rose" : "muted"}>
                    {CATEGORY_ICON[ev.category] ?? "📌"} {CATEGORY_LABEL[ev.category] ?? ev.category} · {ev.title}
                  </Pill>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-[var(--color-ink-soft)]">
        일정을 추가하거나 수정하려면{" "}
        <Link href="/login" className="font-semibold text-[var(--color-brand)]">
          로그인
        </Link>
        하세요.
      </p>
    </main>
  );
}
