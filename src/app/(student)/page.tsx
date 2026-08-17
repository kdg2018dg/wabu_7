import { Suspense } from "react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDateSchedule, getNoteCounts } from "@/lib/period-schedule";
import { todayKST, formatDateKorean } from "@/lib/time";
import { Logo7 } from "@/components/Logo7";
import { PeriodScheduleReadOnly } from "@/components/PeriodScheduleReadOnly";
import { DatePickerNav } from "@/components/DatePickerNav";
import { Skeleton, SkeletonList } from "@/components/Skeleton";
import { HomeSecondary } from "./HomeSecondary";

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = todayKST();
  const { date: dateParam } = await searchParams;
  const date = dateParam || today;

  const upcomingDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // 핵심 기능(교시별 일정)만 먼저 가져와서 즉시 렌더링한다. 랭킹/공지 등 부가 정보는
  // 아래 <Suspense> 로 감싸 별도 스트리밍하므로 이 데이터를 기다리지 않는다.
  const [schedule, noteCounts] = await Promise.all([
    getDateSchedule(supabase, date, profile.id),
    getNoteCounts(supabase, upcomingDates[0], upcomingDates[upcomingDates.length - 1]),
  ]);

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <header className="flex items-center gap-3 md:hidden">
        <Logo7 size={22} />
        <div>
          <h1 className="text-lg font-bold tracking-tight">와부고 7반 학급 운영센터</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{profile.name}님, 오늘도 같이 성장하는 7반</p>
        </div>
      </header>

      {/* 핵심 기능: 교시별 일정 — 접속하자마자 바로 보이도록 최상단에 배치 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">교시별 일정</h2>
          <DatePickerNav basePath="/" currentDate={date} mode="query" />
        </div>

        <div className="-mx-5 mb-2 flex gap-2 overflow-x-auto px-5 pb-1">
          {upcomingDates.map((d) => {
            const isSelected = d === date;
            const count = noteCounts.get(d) ?? 0;
            const label = d === today ? "오늘" : formatDateKorean(d).split(" ").slice(0, 2).join(" ");
            return (
              <Link
                key={d}
                href={`/?date=${d}`}
                className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3.5 py-2"
                style={{
                  background: isSelected ? "var(--color-brand)" : "var(--color-brand-soft)",
                  color: isSelected ? "var(--color-brand-ink)" : "var(--color-brand)",
                }}
              >
                <span className="whitespace-nowrap text-xs font-bold">{label}</span>
                {count > 0 && (
                  <span
                    className="whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold"
                    style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "var(--color-surface)" }}
                  >
                    메모 {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <p className="mb-2 text-sm font-bold">{formatDateKorean(date)}</p>
        <PeriodScheduleReadOnly schedule={schedule} editHref={`/calendar/${date}`} />
      </section>

      <Link href="/study" className="btn-primary flex items-center justify-center gap-2 text-base">
        + 공부시간 인증
      </Link>

      <Suspense fallback={<HomeSecondaryFallback />}>
        <HomeSecondary userId={profile.id} />
      </Suspense>
    </div>
  );
}

function HomeSecondaryFallback() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-24 w-full" />
      <SkeletonList rows={3} rowHeight={56} />
    </div>
  );
}
