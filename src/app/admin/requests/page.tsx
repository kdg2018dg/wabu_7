import { createClient } from "@/lib/supabase/server";
import { Card, Pill } from "@/components/Card";
import type { ItemRequest } from "@/lib/database.types";
import { StatusSelect } from "./StatusSelect";
import { StatusFilter } from "./StatusFilter";




export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("item_requests").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data } = (await query) as { data: ItemRequest[] | null };
  const requests = data ?? [];

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">물품 신청 관리</h1>
        <StatusFilter />
      </div>
      <p className="mb-4 text-xs text-[var(--color-ink-soft)]">
        신청자 정보는 악용 방지를 위해 DB에만 저장되고, 이 화면에는 익명으로 표시됩니다.
      </p>
      <div className="flex flex-col gap-2">
        {requests.length === 0 && (
          <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">해당 조건의 신청이 없어요.</Card>
        )}
        {requests.map((r) => (
          <Card key={r.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{r.item_name}</p>
                {r.estimated_price != null && (
                  <Pill tone="muted">약 {r.estimated_price.toLocaleString()}원</Pill>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{r.reason}</p>
              <p className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">
                {new Date(r.created_at).toLocaleDateString("ko-KR")} · 익명
              </p>
            </div>
            <StatusSelect id={r.id} status={r.status} />
          </Card>
        ))}
      </div>
    </div>
  );
}
