import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrls, CLASS_PHOTOS_BUCKET } from "@/lib/storage";
import { formatDateKorean } from "@/lib/time";
import { dayOfWeekMonToFri, mergeTimetable, PERIODS, isWeekend } from "@/lib/schedule";
import { PageHeader } from "@/components/PageHeader";
import { Card, Pill } from "@/components/Card";
import { DatePickerNav } from "@/components/DatePickerNav";
import type { CalendarEvent, DailyPeriodNote } from "@/lib/database.types";
import type { TimetableRow } from "@/lib/schedule";
import { EventCard } from "./EventCard";
import { PeriodNotes } from "./PeriodNotes";
import { NewEventForm } from "../NewEventForm";

type TimetableRowLike = Pick<TimetableRow, "day_of_week" | "period" | "subject" | "teacher" | "room">;

export default async function CalendarDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const dow = dayOfWeekMonToFri(date);
  const weekend = isWeekend(date);

  const [{ data: events }, { data: template }, { data: overrides }, { data: notes }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*, updated_by_profile:profiles!calendar_events_updated_by_fkey(name)")
      .eq("event_date", date)
      .order("start_time") as unknown as Promise<{
      data: (CalendarEvent & { updated_by_profile: { name: string } | null })[] | null;
    }>,
    supabase.from("timetable_template").select("*") as unknown as Promise<{ data: TimetableRowLike[] | null }>,
    supabase
      .from("timetable_overrides")
      .select("*")
      .eq("user_id", profile.id) as unknown as Promise<{ data: TimetableRowLike[] | null }>,
    supabase
      .from("daily_period_notes")
      .select("*, profiles(name)")
      .eq("note_date", date)
      .order("created_at") as unknown as Promise<{
      data: (DailyPeriodNote & { profiles: { name: string } | null })[] | null;
    }>,
  ]);

  const timetableMap = mergeTimetable(
    (template ?? []) as TimetableRow[],
    (overrides ?? []) as TimetableRow[]
  );

  const notePaths = (notes ?? []).map((n) => n.image_path).filter((p): p is string => !!p);
  const noteUrlMap = await getSignedImageUrls(supabase, notePaths, CLASS_PHOTOS_BUCKET);
  const notesWithUrls = (notes ?? []).map((n) => ({
    ...n,
    authorName: n.profiles?.name,
    imageUrl: n.image_path ? noteUrlMap.get(n.image_path) ?? null : null,
  }));

  return (
    <div>
      <div className="px-5 pt-4">
        <Link href="/calendar" className="text-xs font-semibold text-[var(--color-brand)]">
          ← 캘린더로
        </Link>
      </div>
      <div className="flex items-center justify-between pr-5">
        <PageHeader title={formatDateKorean(date)} subtitle={weekend ? "주말" : undefined} compact />
        <DatePickerNav basePath="/calendar" currentDate={date} />
      </div>

      <div className="flex flex-col gap-5 px-5 pb-6">
        <section>
          <p className="mb-2 px-1 text-sm font-bold">이 날의 일정</p>
          <div className="flex flex-col gap-2">
            {(events ?? []).length === 0 && (
              <Card className="p-4 text-center text-sm text-[var(--color-ink-soft)]">등록된 일정이 없어요.</Card>
            )}
            {(events ?? []).map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
          <div className="mt-2">
            <NewEventForm defaultDate={date} />
          </div>
        </section>

        {dow > 0 && (
          <section>
            <p className="mb-2 px-1 text-sm font-bold">교시별 일정 {profile && "· 내 시간표 기준"}</p>
            <div className="flex flex-col gap-2">
              {PERIODS.map((period) => {
                const cell = timetableMap.get(`${dow}-${period}`);
                const periodNotes = notesWithUrls.filter((n) => n.period === period);
                return (
                  <Card key={period} className="p-3">
                    <div className="flex items-center gap-2">
                      <Pill tone="brand">{period}교시</Pill>
                      {cell?.subject ? (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{cell.subject}</p>
                          <p className="text-xs text-[var(--color-ink-soft)]">
                            {cell.teacher} {cell.room && `· ${cell.room}`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--color-ink-soft)]">수업 없음</p>
                      )}
                      {periodNotes.length > 0 && (
                        <span className="ml-auto shrink-0 text-xs font-bold text-[var(--color-mint)]">
                          📝 {periodNotes.length}
                        </span>
                      )}
                    </div>
                    <PeriodNotes noteDate={date} period={period} initialNotes={periodNotes} currentUserName={profile.name} />
                  </Card>
                );
              })}
              {PERIODS.every((p) => !timetableMap.get(`${dow}-${p}`)?.subject) && (
                <p className="px-1 text-center text-xs text-[var(--color-ink-soft)]">
                  등록된 시간표가 없어요.{" "}
                  <Link href="/timetable" className="font-semibold text-[var(--color-brand)]">
                    내 시간표 설정하기
                  </Link>
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
