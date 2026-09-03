import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDateSchedule, getNoteCounts } from "@/lib/period-schedule";
import { getWeeklyRankings } from "@/lib/queries";
import { getPublicImageUrl } from "@/lib/storage";
import { todayKST, formatDateKorean, formatMinutes } from "@/lib/time";
import { Logo7 } from "@/components/Logo7";
import { Card, Pill } from "@/components/Card";
import { ClickableImage } from "@/components/Lightbox";
import { PeriodScheduleReadOnly } from "@/components/PeriodScheduleReadOnly";
import { DatePickerNav } from "@/components/DatePickerNav";
import { PublicMonthGrid } from "@/components/PublicMonthGrid";
import { MealCard } from "@/components/MealCard";
import { Skeleton } from "@/components/Skeleton";
import type { CalendarEvent, Announcement } from "@/lib/database.types";

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

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

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { date: dateParam, month: monthParam } = await searchParams;
  const today = todayKST();
  const date = dateParam || today;
  const currentMonth = monthParam || date.slice(0, 7);
  const { firstDay, lastDay, daysInMonth, startWeekday, y, m } = monthRange(currentMonth);

  const supabase = await createClient();
  const [schedule, { data: monthEvents }, monthNoteCounts, rankings, { data: announcements }] = await Promise.all([
    getDateSchedule(supabase, date),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("event_date", firstDay)
      .lte("event_date", lastDay)
      .order("event_date") as unknown as Promise<{ data: CalendarEvent[] | null }>,
    getNoteCounts(supabase, firstDay, lastDay),
    getWeeklyRankings(supabase),
    supabase
      .from("announcements")
      .select("*")
      .order("is_important", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(5) as unknown as Promise<{ data: Announcement[] | null }>,
  ]);

  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of monthEvents ?? []) {
    if (!byDate.has(ev.event_date)) byDate.set(ev.event_date, []);
    byDate.get(ev.event_date)!.push(ev);
  }

  // 빠른 날짜 이동: 최근 7일 스트립
  const upcomingDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const stripNoteCounts = await getNoteCounts(supabase, upcomingDates[0], upcomingDates[upcomingDates.length - 1]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-5 py-8 md:max-w-3xl">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo7 size={22} />
          <div>
            <h1 className="text-lg font-bold">와부고 7반 교시별 일정</h1>
            <p className="text-xs text-[var(--color-ink-soft)]">로그인 없이 볼 수 있어요</p>
          </div>
        </div>
        <Link href="/login" className="btn-primary px-4 !min-h-9 text-sm">
          로그인
        </Link>
      </header>

      {/* 빠른 날짜 이동: 최근 7일 스트립 */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {upcomingDates.map((d) => {
          const isSelected = d === date;
          const count = stripNoteCounts.get(d) ?? 0;
          const label = d === today ? "오늘" : formatDateKorean(d).split(" ").slice(0, 2).join(" ");
          return (
            <Link
              key={d}
              href={`/schedule?date=${d}`}
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3.5 py-2"
              style={{
                background: isSelected ? "var(--color-brand)" : "var(--color-brand-soft)",
                color: isSelected ? "var(--color-brand-ink)" : "var(--color-brand)",
              }}
            >
              <span className="whitespace-nowrap text-xs font-bold">{label}</span>
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : "var(--color-surface)",
                  }}
                >
                  메모 {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <PublicMonthGrid
        year={y}
        month={m}
        daysInMonth={daysInMonth}
        startWeekday={startWeekday}
        byDate={byDate}
        noteCounts={monthNoteCounts}
        today={today}
        selectedDate={date}
      />

      <div className="flex items-center justify-between">
        <p className="text-base font-bold">{formatDateKorean(date)}</p>
        <DatePickerNav basePath="/schedule" currentDate={date} mode="query" />
      </div>
      <div className="-mt-3 flex justify-end gap-2 text-xs">
        <Link href={`/schedule?date=${addDays(date, -1)}`} className="font-semibold text-[var(--color-brand)]">
          ← 전날
        </Link>
        <Link href={`/schedule?date=${addDays(date, 1)}`} className="font-semibold text-[var(--color-brand)]">
          다음날 →
        </Link>
      </div>

      {/* 급식 정보 — 별도의 작은 칸으로, 일정/캘린더 시스템과는 분리해서 표시 */}
      <Suspense key={date} fallback={<Skeleton className="h-16 w-full" />}>
        <MealCard date={date} />
      </Suspense>

      <PeriodScheduleReadOnly schedule={schedule} />

      <section>
        <h2 className="mb-2 text-sm font-bold">이번 주 공부시간 순위</h2>
        <Card className="mb-1 p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 우리 반 총 공부시간</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(rankings.classTotal)}</p>
        </Card>
        <Card className="divide-y divide-[var(--color-line)]">
          {rankings.rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
              아직 승인된 공부시간이 없어요.
            </p>
          ) : (
            rankings.rows.slice(0, 10).map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 text-center text-sm font-bold text-[var(--color-ink-soft)]">
                  {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{r.displayName}</p>
                <p className="stat-figure text-sm font-bold">{formatMinutes(r.totalMinutes)}</p>
              </div>
            ))
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">공지사항</h2>
        <div className="flex flex-col gap-2">
          {!announcements?.length ? (
            <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
              아직 공지사항이 없어요.
            </Card>
          ) : (
            announcements.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center gap-2">
                  {a.is_important && <Pill tone="rose">중요</Pill>}
                  <p className="text-sm font-bold">{a.title}</p>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-ink-soft)]">{a.content}</p>
                {a.image_path && (
                  <ClickableImage
                    src={getPublicImageUrl(supabase, a.image_path)}
                    alt={a.title}
                    className="mt-2 max-h-64 w-full rounded-xl object-cover"
                  />
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      <p className="mt-2 text-center text-xs text-[var(--color-ink-soft)]">
        일정을 추가하거나 메모를 남기려면{" "}
        <Link href="/login" className="font-semibold text-[var(--color-brand)]">
          로그인
        </Link>
        하세요. 로그인하면 개인 시간표와 편집 기능도 이용할 수 있어요.
      </p>
    </main>
  );
}
