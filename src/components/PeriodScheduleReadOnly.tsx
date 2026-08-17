import Link from "next/link";
import { Card, Pill } from "@/components/Card";
import { ClickableImage } from "@/components/Lightbox";
import { CATEGORY_LABEL, CATEGORY_ICON } from "@/lib/schedule";
import type { DateSchedule } from "@/lib/period-schedule";

export function PeriodScheduleReadOnly({
  schedule,
  editHref,
}: {
  schedule: DateSchedule;
  /** 주어지면 "편집하기" 링크를 보여준다 (로그인 상태에서만 전달) */
  editHref?: string;
}) {
  const { events, periods, dow } = schedule;

  return (
    <div className="flex flex-col gap-3">
      {events.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {events.map((ev) => (
            <Pill key={ev.id} tone={ev.priority === "high" ? "rose" : "muted"}>
              {CATEGORY_ICON[ev.category] ?? "📌"} {CATEGORY_LABEL[ev.category] ?? ev.category} · {ev.title}
            </Pill>
          ))}
        </div>
      )}

      {dow === 0 ? (
        <Card className="p-4 text-center text-sm text-[var(--color-ink-soft)]">주말이에요 🎉</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {periods.map((p) => (
            <Card key={p.period} className="p-3">
              <div className="flex items-center gap-2">
                <Pill tone="brand">{p.period}교시</Pill>
                {p.subject ? (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{p.subject}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">
                      {p.teacher} {p.room && `· ${p.room}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-ink-soft)]">수업 없음</p>
                )}
                {p.notes.length > 0 && (
                  <span className="ml-auto shrink-0 text-xs font-semibold text-[var(--color-brand)]">
                    메모 {p.notes.length}개
                  </span>
                )}
              </div>
              {p.notes.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-line)] pt-2">
                  {p.notes.map((n) => (
                    <div key={n.id}>
                      {n.authorName && (
                        <p className="text-[10px] font-semibold text-[var(--color-ink-soft)]">{n.authorName}</p>
                      )}
                      {n.content && <p className="whitespace-pre-line text-sm">{n.content}</p>}
                      {n.imageUrl && (
                        <ClickableImage src={n.imageUrl} alt="첨부 사진" className="mt-1.5 max-h-48 rounded-lg object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editHref && (
        <Link href={editHref} className="btn-secondary text-center">
          이 날짜 편집하기
        </Link>
      )}
    </div>
  );
}
