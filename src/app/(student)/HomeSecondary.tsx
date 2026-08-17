import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings, getPreviousWeekClassTotal } from "@/lib/queries";
import { formatMinutes, getWeekRange } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import type { Announcement } from "@/lib/database.types";
import Link from "next/link";

export async function HomeSecondary({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [{ data: announcements }, myWeek, { rows, classTotal, weekStart, weekEnd }, prevClassTotal] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("*")
        .order("is_important", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(3) as unknown as Promise<{ data: Announcement[] | null }>,
      getMyWeekMinutes(supabase, userId),
      getWeeklyRankings(supabase),
      getPreviousWeekClassTotal(supabase),
    ]);

  const myRank = rows.find((r) => r.user_id === userId);
  const growthPct =
    prevClassTotal > 0 ? Math.round(((classTotal - prevClassTotal) / prevClassTotal) * 100) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 내 공부시간</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(myWeek)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">현재 순위</p>
          <p className="stat-figure mt-1 text-2xl font-extrabold">
            {myRank ? `${myRank.rank}위` : "-"}
            <span className="text-sm font-medium text-[var(--color-ink-soft)]"> / {rows.length}명</span>
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--color-ink-soft)]">이번 주 우리 반 총 공부시간</p>
          {growthPct !== null && (
            <Pill tone={growthPct >= 0 ? "mint" : "muted"}>
              {growthPct >= 0 ? `지난주 대비 +${growthPct}%` : `지난주 대비 ${growthPct}%`}
            </Pill>
          )}
        </div>
        <p className="stat-figure mt-1 text-2xl font-extrabold">{formatMinutes(classTotal)}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">같이 성장하고 있어요.</p>
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold">공지사항</h2>
          <Link href="/announcements" className="text-xs font-semibold text-[var(--color-brand)]">
            더보기
          </Link>
        </div>
        <Card className="divide-y divide-[var(--color-line)]">
          {!announcements?.length ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">아직 공지사항이 없어요.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {a.is_important && <Pill tone="rose">중요</Pill>}
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-ink-soft)]">{a.content}</p>
              </div>
            ))
          )}
        </Card>
      </section>

      <p className="pt-1 text-center text-[11px] text-[var(--color-ink-soft)]">
        {weekStart} ~ {weekEnd} 기준 · Asia/Seoul
      </p>
    </>
  );
}

async function getMyWeekMinutes(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { start, end } = getWeekRange();
  const { data } = await supabase
    .from("study_sessions")
    .select("duration_minutes")
    .eq("user_id", userId)
    .eq("status", "approved")
    .gte("study_date", start)
    .lte("study_date", end);

  return (data ?? []).reduce((sum: number, r: { duration_minutes: number }) => sum + r.duration_minutes, 0);
}
