"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo7 } from "./Logo7";
import { LogoutButton } from "./LogoutButton";

const primaryItems = [
  { href: "/", label: "홈" },
  { href: "/calendar", label: "교시별 일정" },
  { href: "/study", label: "공부 인증" },
  { href: "/rankings", label: "순위" },
];

const moreItems = [
  { href: "/study/history", label: "내 인증 기록" },
  { href: "/timetable", label: "내 시간표" },
  { href: "/announcements", label: "공지사항" },
  { href: "/requests", label: "물품 신청" },
];

export function DesktopNav({ name, role }: { name: string; role: "student" | "admin" }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const moreActive = moreItems.some((i) => pathname.startsWith(i.href)) || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo7 size={18} />
          <span className="text-sm font-bold">7반 학급 운영센터</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1" aria-label="주요 메뉴">
          {primaryItems.map((item) => {
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

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: moreActive || moreOpen ? "var(--color-brand)" : "var(--color-ink-soft)",
                background: moreActive || moreOpen ? "var(--color-brand-soft)" : "transparent",
              }}
            >
              더보기 {moreOpen ? "▲" : "▼"}
            </button>
            {moreOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-card)]"
                onClick={() => setMoreOpen(false)}
              >
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                  >
                    {item.label}
                  </Link>
                ))}
                {role === "admin" && (
                  <>
                    <div className="my-1 border-t border-[var(--color-line)]" />
                    <Link
                      href="/admin"
                      className="block px-4 py-2.5 text-sm font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                    >
                      관리자 페이지
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <span className="text-sm font-medium text-[var(--color-ink-soft)]">{name}</span>
        <LogoutButton className="btn-ghost !min-h-9 px-3 text-xs text-[var(--color-rose)]" />
      </div>
    </header>
  );
}
