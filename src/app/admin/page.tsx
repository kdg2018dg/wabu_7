import { createClient } from "@/lib/supabase/server";
import { getWeekRange, formatMinutes, todayKST } from "@/lib/time";
import { Card } from "@/components/Card";

const ACTION_LABEL: Record<string, string> = {
  approve_study_session: "공부 인증을 승인했어요",
  reject_study_session: "공부 인증을 반려했어요",
  edit_study_session_duration: "공부 인증 시간을 수정했어요",
  update_item_request_status: "물품 신청 상태를 변경했어요",
  set_profile_role: "권한을 변경했어요",
  clear_test_data: "테스트 데이터를 정리했어요",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { start, end } = getWeekRange();
  const today = todayKST();

  const [studentCount, weekSessions, weekPendingCount, upcomingEventCount, requestCount, recentActivity] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase
        .from("study_sessions")
        .select("duration_minutes, status")
        .gte("study_date", start)
        .lte("study_date", end),
      supabase
        .from("study_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .gte("event_date", today),
      supabase.from("item_requests").select("id", { count: "exact", head: true }),
      supabase
        .from("audit_logs")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const weekApproved = (weekSessions.data ?? []).filter((s) => s.status === "approved");
  const weekRejected = (weekSessions.data ?? []).filter((s) => s.status === "rejected");
  const totalMinutes = weekApproved.reduce((sum, s) => sum + s.duration_minutes, 0);
  const submissionCount = weekSessions.data?.length ?? 0;
  const decidedCount = weekApproved.length + weekRejected.length;
  const approvalRate = decidedCount > 0 ? Math.round((weekApproved.length / decidedCount) * 100) : null;
  const avgMinutesPerStudent =
    studentCount.count && studentCount.count > 0 ? Math.round(totalMinutes / studentCount.count) : 0;

  const stats = [
    { label: "학생 수", value: `${studentCount.count ?? 0}명` },
    { label: "이번 주 총 공부시간", value: formatMinutes(totalMinutes) },
    { label: "학생 평균 공부시간", value: formatMinutes(avgMinutesPerStudent) },
    { label: "이번 주 인증 건수", value: `${submissionCount}건` },
    { label: "승인률", value: approvalRate === null ? "-" : `${approvalRate}%` },
    { label: "승인 대기 인증", value: `${weekPendingCount.count ?? 0}건`, highlight: true },
    { label: "예정된 일정", value: `${upcomingEventCount.count ?? 0}개` },
    { label: "물품 신청", value: `${requestCount.count ?? 0}건` },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">대시보드</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-[var(--color-ink-soft)]">{s.label}</p>
            <p
              className="stat-figure mt-1 text-2xl font-extrabold"
              style={s.highlight ? { color: "var(--color-brand)" } : undefined}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
        {start} ~ {end} 기준 (Asia/Seoul)
      </p>

      <h2 className="mb-2 mt-6 text-sm font-bold">최근 활동</h2>
      <Card className="divide-y divide-[var(--color-line)]">
        {(recentActivity.data ?? []).length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">아직 활동 기록이 없어요.</p>
        )}
        {(recentActivity.data ?? []).map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <p className="text-sm">
              <span className="font-semibold">{(log as { profiles?: { name: string } | null }).profiles?.name ?? "알 수 없음"}</span>
              님이 {ACTION_LABEL[log.action] ?? log.action}
            </p>
            <span className="shrink-0 text-xs text-[var(--color-ink-soft)]">{timeAgo(log.created_at)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
