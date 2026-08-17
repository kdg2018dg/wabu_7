export function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d, i) => {
        const heightPct = Math.max((d.value / max) * 100, 2);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-full w-full items-end" title={`${d.label}: ${formatValue(d.value)}`}>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${heightPct}%`,
                  background: d.highlight ? "var(--color-brand)" : "var(--color-brand-soft)",
                  minHeight: 3,
                }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-ink-soft)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
