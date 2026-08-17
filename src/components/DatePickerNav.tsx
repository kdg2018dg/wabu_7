"use client";

import { useRouter } from "next/navigation";

export function DatePickerNav({
  basePath,
  currentDate,
  mode = "path",
}: {
  basePath: string;
  currentDate: string;
  /** "path" -> {basePath}/{date} (예: /calendar/2026-08-20), "query" -> {basePath}?date={date} */
  mode?: "path" | "query";
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-ink-soft)]">
      날짜 이동
      <input
        type="date"
        defaultValue={currentDate}
        onChange={(e) => {
          if (!e.target.value) return;
          const href =
            mode === "query"
              ? `${basePath}?date=${e.target.value}`
              : `${basePath}/${e.target.value}`;
          router.push(href);
        }}
        className="input !min-h-9 !py-0 text-sm"
      />
    </label>
  );
}
