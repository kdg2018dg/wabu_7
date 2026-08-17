export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--color-line)]/60 ${className}`} style={style} />;
}

export function SkeletonList({ rows = 4, rowHeight = 64 }: { rows?: number; rowHeight?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ height: rowHeight }} />
      ))}
    </div>
  );
}
