import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrl } from "@/lib/storage";
import { formatMinutes, formatDateKorean, formatShortDate, lastNDays, todayKST, getWeekRange, getPreviousWeekRange } from "@/lib/time";
import { Card, Pill } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { BarChart } from "@/components/BarChart";
import type { StudySession } from "@/lib/database.types";
import { DeletePendingButton } from "./DeletePendingButton";

const HISTORY_LIMIT = 60;

const STATUS_LABEL: Record<string, { text: string; tone: "gold" | "mint" | "rose" }> = {
  pending: { text: "승인 대기", tone: "gold" },
  approved: { text: "승인됨", tone: "mint" },
  rejected: { text: "반려됨", tone: "rose" },
};

export default async function StudyHistoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = todayKST();
  const days35 = lastNDays(35, today);
  const statsStart = days35[0];

  const [{ data }, { data: statsData }] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", profile.id)
      .order("study_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT) as unknown as Promise<{ data: StudySession[] | null }>,
    supabase
      .from("study_sessions")
      .select("study_date, duration_minutes")
      .eq("user_id", profile.id)
      .eq("status", "approved")
      .gte("study_date", statsStart)
      .lte("study_date", today) as unknown as Promise<{
      data: { study_date: string; duration_minutes: number }[] | null;
    }>,
  ]);

  const sessions = data ?? [];
  const withUrls = await Promise.all(
    sessions.map(async (s) => ({ ...s, imageUrl: await getSignedImageUrl(supabase, s.image_path) }))
  );

  // 최근 7일 일별 합계
  const last7 = lastNDays(7, today);
  const dailyTotals = last7.map((d) => ({
    label: formatShortDate(d),
    value: (statsData ?? []).filter((s) => s.study_date === d).reduce((sum, s) => sum + s.duration_minutes, 0),
    highlight: d === today,
  }));

  // 최근 4주 주별 합계 (이번 주 포함, 오래된 순)
  const weekRanges: { label: string; start: string; end: string }[] = [];
  let cursor = today;
  for (let weeksAgo = 0; weeksAgo < 4; weeksAgo++) {
    const range = weeksAgo === 0 ? getWeekRange(cursor) : getPreviousWeekRange(cursor);
    weekRanges.unshift({
      label: weeksAgo === 0 ? "이번주" : `${weeksAgo}주 전`,
      start: range.start,
      end: range.end,
    });
    cursor = range.start;
  }
  const weeklyTotals = weekRanges.map((r) => ({
    label: r.label,
    value: (statsData ?? [])
      .filter((s) => s.study_date >= r.start && s.study_date <= r.end)
      .reduce((sum, s) => sum + s.duration_minutes, 0),
    highlight: r.label === "이번주",
  }));

  return (
    <div>
      <PageHeader title="내 인증 기록" compact />
      <div className="flex flex-col gap-3 px-5 pb-6">
        <Card className="p-4">
          <p className="mb-2 text-xs font-bold text-[var(--color-ink-soft)]">최근 7일 공부시간</p>
          <BarChart data={dailyTotals} formatValue={formatMinutes} />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-xs font-bold text-[var(--color-ink-soft)]">최근 4주 공부시간</p>
          <BarChart data={weeklyTotals} formatValue={formatMinutes} />
        </Card>

        {withUrls.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
            아직 제출한 인증이 없어요. 첫 공부시간을 인증해보세요!
          </Card>
        )}
        {withUrls.map((s) => (
          <Card key={s.id} className="flex gap-3 p-3">
            {s.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt="공부 인증 사진" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{formatDateKorean(s.study_date)}</p>
                <div className="flex items-center gap-2">
                  <Pill tone={STATUS_LABEL[s.status].tone}>{STATUS_LABEL[s.status].text}</Pill>
                  {s.status === "pending" && <DeletePendingButton id={s.id} />}
                </div>
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{formatMinutes(s.duration_minutes)}</p>
              {s.memo && <p className="mt-0.5 truncate text-xs text-[var(--color-ink-soft)]">{s.memo}</p>}
              {s.status === "rejected" && s.rejection_reason && (
                <p className="mt-1 text-xs font-medium text-[var(--color-rose)]">사유: {s.rejection_reason}</p>
              )}
            </div>
          </Card>
        ))}
        {withUrls.length === HISTORY_LIMIT && (
          <p className="px-1 text-center text-xs text-[var(--color-ink-soft)]">
            최근 {HISTORY_LIMIT}건까지만 표시돼요.
          </p>
        )}
      </div>
    </div>
  );
}
