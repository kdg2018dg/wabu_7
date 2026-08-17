import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-line)] shadow-[var(--shadow-card)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "gold" | "mint" | "rose" | "muted";
}) {
  const tones: Record<string, string> = {
    default: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    brand: "bg-[var(--color-brand)] text-[var(--color-brand-ink)]",
    gold: "bg-[var(--pill-gold-bg)] text-[var(--pill-gold-ink)]",
    mint: "bg-[var(--pill-mint-bg)] text-[var(--color-mint)]",
    rose: "bg-[var(--pill-rose-bg)] text-[var(--color-rose)]",
    muted: "bg-[var(--pill-muted-bg)] text-[var(--color-ink-soft)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
