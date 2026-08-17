"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo7 } from "./Logo7";
import { LogoutButton } from "./LogoutButton";

const items = [
  { href: "/", label: "홈" },
  { href: "/study", label: "공부 인증" },
  { href: "/study/history", label: "내 인증 기록" },
  { href: "/calendar", label: "캘린더" },
  { href: "/timetable", label: "시간표" },
  { href: "/rankings", label: "순위" },
  { href: "/announcements", label: "공지사항" },
  { href: "/requests", label: "물품 신청" },
];

export function DesktopNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo7 size={18} />
          <span className="text-sm font-bold">7반 학급 운영센터</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1" aria-label="주요 메뉴">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--color-brand)" : "var(--color-ink-soft)",
                  background: active ? "var(--color-brand-soft)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="text-sm font-medium text-[var(--color-ink-soft)]">{name}</span>
        <LogoutButton className="btn-ghost !min-h-9 px-3 text-xs text-[var(--color-rose)]" />
      </div>
    </header>
  );
}
