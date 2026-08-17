import type { SupabaseClient } from "@supabase/supabase-js";
import { dayOfWeekMonToFri, mergeTimetable, PERIODS } from "@/lib/schedule";
import { getSignedImageUrls, CLASS_PHOTOS_BUCKET } from "@/lib/storage";
import type { CalendarEvent, DailyPeriodNote } from "@/lib/database.types";
import type { TimetableRow } from "@/lib/schedule";

export interface PeriodScheduleEntry {
  period: number;
  subject: string | null;
  teacher: string | null;
  room: string | null;
  notes: (DailyPeriodNote & { authorName?: string; imageUrl: string | null })[];
}

export interface DateSchedule {
  date: string;
  dow: number; // 1~5 월~금, 0 주말
  events: CalendarEvent[];
  periods: PeriodScheduleEntry[];
  noteCount: number;
}

/**
 * 특정 날짜의 일정 + 교시별 시간표 + 교시별 메모를 한 번에 가져온다.
 * userId 가 주어지면 그 학생의 개인화된 시간표를 반영하고, 없으면(비로그인) 학급 기본 시간표를 사용한다.
 */
export async function getDateSchedule(
  supabase: SupabaseClient,
  date: string,
  userId?: string
): Promise<DateSchedule> {
  const dow = dayOfWeekMonToFri(date);

  const [{ data: events }, { data: template }, overridesResult, { data: notes }] = await Promise.all([
    supabase.from("calendar_events").select("*").eq("event_date", date).order("start_time"),
    supabase.from("timetable_template").select("*"),
    userId
      ? supabase.from("timetable_overrides").select("*").eq("user_id", userId)
      : Promise.resolve({ data: [] as TimetableRow[] }),
    supabase.from("daily_period_notes").select("*, profiles(name)").eq("note_date", date).order("created_at"),
  ]);

  const timetableMap = mergeTimetable(
    (template ?? []) as TimetableRow[],
    (overridesResult.data ?? []) as TimetableRow[]
  );

  const notesTyped = (notes ?? []) as (DailyPeriodNote & { profiles: { name: string } | null })[];
  const notePaths = notesTyped.map((n) => n.image_path).filter((p): p is string => !!p);
  const urlMap = await getSignedImageUrls(supabase, notePaths, CLASS_PHOTOS_BUCKET);

  const periods: PeriodScheduleEntry[] = PERIODS.map((period) => {
    const cell = timetableMap.get(`${dow}-${period}`);
    const periodNotes = notesTyped
      .filter((n) => n.period === period)
      .map((n) => ({
        ...n,
        authorName: n.profiles?.name,
        imageUrl: n.image_path ? urlMap.get(n.image_path) ?? null : null,
      }));
    return {
      period,
      subject: cell?.subject ?? null,
      teacher: cell?.teacher ?? null,
      room: cell?.room ?? null,
      notes: periodNotes,
    };
  });

  return {
    date,
    dow,
    events: (events ?? []) as CalendarEvent[],
    periods,
    noteCount: notesTyped.length,
  };
}

/** 여러 날짜의 메모 개수만 가볍게 가져온다 (목록 화면에서 "메모 N개" 뱃지 표시용) */
export async function getNoteCounts(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("daily_period_notes")
    .select("note_date")
    .gte("note_date", fromDate)
    .lte("note_date", toDate);

  const map = new Map<string, number>();
  for (const row of (data ?? []) as { note_date: string }[]) {
    map.set(row.note_date, (map.get(row.note_date) ?? 0) + 1);
  }
  return map;
}
