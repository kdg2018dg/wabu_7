"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ItemRequestStatus } from "@/lib/database.types";

const STATUS_LABEL: Record<ItemRequestStatus, string> = {
  received: "접수",
  reviewing: "검토 중",
  planned: "구매 예정",
  purchased: "구매 완료",
  on_hold: "보류",
  rejected: "반려",
};

export function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  return (
    <select
      defaultValue={current}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value === "all" ? "/admin/requests" : `/admin/requests?status=${value}`);
      }}
      className="input !min-h-9 !py-0 text-sm"
    >
      <option value="all">전체 상태</option>
      {Object.entries(STATUS_LABEL).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
