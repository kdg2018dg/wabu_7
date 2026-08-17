import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDateSchedule, getNoteCounts } from "@/lib/period-schedule";
import { todayKST, formatDateKorean } from "@/lib/time";
import { Logo7 } from "@/components/Logo7";
import { PeriodScheduleReadOnly } from "@/components/PeriodScheduleReadOnly";
import { DatePickerNav } from "@/components/DatePickerNav";

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = todayKST();
  const date = dateParam || today;

  const supabase = await createClient();
  const schedule = await getDateSchedule(supabase, date);

  // 다음 7일 미리보기 (날짜 · 메모 개수)
  const upcomingDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const noteCounts = await getNoteCounts(supabase, upcomingDates[0], upcomingDates[upcomingDates.length - 1]);

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
          const count = noteCounts.get(d) ?? 0;
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

      <PeriodScheduleReadOnly schedule={schedule} />

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
