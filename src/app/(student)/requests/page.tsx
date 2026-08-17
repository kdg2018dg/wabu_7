"use client";

import { useState } from "react";
import { useItemRequestStatsQuery, useMyItemRequestsQuery, useSubmitItemRequestMutation } from "@/lib/queries/item-requests";
import { Card, Pill } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

const STATUS_LABEL: Record<string, { text: string; tone: "gold" | "mint" | "rose" | "muted" | "brand" }> = {
  received: { text: "접수", tone: "muted" },
  reviewing: { text: "검토 중", tone: "gold" },
  planned: { text: "구매 예정", tone: "brand" },
  purchased: { text: "구매 완료", tone: "mint" },
  on_hold: { text: "보류", tone: "muted" },
  rejected: { text: "반려", tone: "rose" },
};

export default function RequestsPage() {
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const { data: stats, isLoading: loadingStats } = useItemRequestStatsQuery();
  const { data: myRequests, isLoading: loadingMine } = useMyItemRequestsQuery();
  const submit = useSubmitItemRequestMutation();
  const [tab, setTab] = useState<"stats" | "mine">("stats");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    submit.mutate(
      { itemName, reason, price },
      {
        onSuccess: () => {
          setItemName("");
          setReason("");
          setPrice("");
          setMessage("익명으로 신청이 접수되었어요. 감사합니다!");
        },
        onError: () => {
          setMessage("신청을 제출하지 못했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  }

  return (
    <div>
      <PageHeader title="비치물 신청" subtitle="신청자 이름은 다른 학생/관리자 화면에 공개되지 않아요" compact />

      <div className="flex flex-col gap-5 px-5 pb-6">
        <Card className="p-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              필요한 물품
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="예: 물티슈"
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              왜 필요한가요?
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              예상 가격 (선택)
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="원 단위"
                className="input"
              />
            </label>

            {message && <p className="text-sm font-medium text-[var(--color-brand)]">{message}</p>}

            <button type="submit" disabled={submit.isPending} className="btn-primary">
              {submit.isPending ? "제출 중..." : "익명으로 신청하기"}
            </button>
          </form>
        </Card>

        <section>
          <div className="mb-2 flex gap-1 rounded-xl bg-[var(--color-brand-soft)] p-1">
            <button
              onClick={() => setTab("stats")}
              className="flex-1 rounded-lg py-2 text-xs font-bold transition-colors"
              style={{
                background: tab === "stats" ? "var(--color-surface)" : "transparent",
                color: tab === "stats" ? "var(--color-brand)" : "var(--color-ink-soft)",
              }}
            >
              우리 반 신청 현황
            </button>
            <button
              onClick={() => setTab("mine")}
              className="flex-1 rounded-lg py-2 text-xs font-bold transition-colors"
              style={{
                background: tab === "mine" ? "var(--color-surface)" : "transparent",
                color: tab === "mine" ? "var(--color-brand)" : "var(--color-ink-soft)",
              }}
            >
              내 신청 목록
            </button>
          </div>

          {tab === "stats" ? (
            <Card className="divide-y divide-[var(--color-line)]">
              {loadingStats && (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">불러오는 중...</p>
              )}
              {!loadingStats && Object.keys(stats ?? {}).length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                  아직 신청된 물품이 없어요.
                </p>
              )}
              {Object.entries(stats ?? {})
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([name, { count, status }]) => {
                  const maxCount = Math.max(...Object.values(stats ?? {}).map((s) => s.count), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={name} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{name}</p>
                        <Pill tone={STATUS_LABEL[status]?.tone ?? "muted"}>{STATUS_LABEL[status]?.text ?? status}</Pill>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-canvas)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-brand)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-[var(--color-ink-soft)]">요청 {count}회</span>
                      </div>
                    </div>
                  );
                })}
            </Card>
          ) : (
            <Card className="divide-y divide-[var(--color-line)]">
              {loadingMine && (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">불러오는 중...</p>
              )}
              {!loadingMine && (myRequests ?? []).length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                  아직 신청한 물품이 없어요.
                </p>
              )}
              {(myRequests ?? []).map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.item_name}</p>
                    <Pill tone={STATUS_LABEL[r.status]?.tone ?? "muted"}>{STATUS_LABEL[r.status]?.text ?? r.status}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{r.reason}</p>
                  {r.status === "rejected" && r.rejection_reason && (
                    <p className="mt-1 text-xs font-medium text-[var(--color-rose)]">반려 사유: {r.rejection_reason}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
