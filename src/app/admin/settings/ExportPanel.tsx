"use client";

import { useState } from "react";

const EXPORTS = [
  { type: "study-sessions", label: "공부시간 데이터" },
  { type: "rankings", label: "학생별 주간 순위" },
  { type: "item-requests", label: "물품 신청 데이터" },
];

export function ExportPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildUrl(type: string) {
    const params = new URLSearchParams({ type });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/admin/export?${params.toString()}`;
  }

  async function download(type: string) {
    setError(null);
    setDownloading(type);
    try {
      const res = await fetch(buildUrl(type));
      if (!res.ok) throw new Error("다운로드에 실패했어요.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("다운로드에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
          시작일 (선택)
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input !min-h-9 text-sm" />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
          종료일 (선택)
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input !min-h-9 text-sm" />
        </label>
      </div>
      <p className="text-[11px] text-[var(--color-ink-soft)]">
        비워두면 전체 기간이 내보내집니다. 랭킹은 시작일이 속한 한 주만 내보내요.
      </p>
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
      <div className="flex flex-col gap-2">
        {EXPORTS.map((e) => (
          <button
            key={e.type}
            type="button"
            disabled={downloading === e.type}
            onClick={() => download(e.type)}
            className="btn-ghost text-center text-sm"
          >
            {downloading === e.type ? "다운로드 중..." : e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
