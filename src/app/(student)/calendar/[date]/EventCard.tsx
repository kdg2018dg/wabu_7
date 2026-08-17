"use client";

import { useRef, useState, useTransition } from "react";
import { updateEvent, deleteEvent } from "../actions";
import { Card, Pill } from "@/components/Card";
import { ColorPicker } from "@/components/ColorPicker";
import { CATEGORY_LABEL, CATEGORY_ICON } from "@/lib/schedule";
import type { CalendarEvent } from "@/lib/database.types";

export function EventCard({ event }: { event: CalendarEvent & { updated_by_profile?: { name: string } | null } }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Pill tone={event.priority === "high" ? "rose" : "muted"}>
                {CATEGORY_ICON[event.category] ?? "📌"} {CATEGORY_LABEL[event.category] ?? event.category}
              </Pill>
              <p className="truncate text-sm font-bold" style={event.color ? { color: event.color } : undefined}>
                {event.title}
              </p>
            </div>
            {event.subject && <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{event.subject}</p>}
            {event.description && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{event.description}</p>}
            {event.updated_by_profile?.name && (
              <p className="mt-1 text-[10px] text-[var(--color-ink-soft)]">
                {event.updated_by_profile.name}님이 마지막으로 수정
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => setEditing(true)} className="btn-ghost !min-h-8 px-3 text-xs">
              수정
            </button>
            <button
              disabled={pending}
              onClick={() => {
                if (confirm("이 일정을 삭제할까요?"))
                  startTransition(async () => {
                    await deleteEvent(event.id, event.event_date);
                  });
              }}
              className="btn-ghost !min-h-8 px-3 text-xs text-[var(--color-rose)]"
            >
              삭제
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            const res = await updateEvent(event.id, formData);
            if (res.error) setError(res.error);
            else {
              setError(null);
              setEditing(false);
            }
          })
        }
        className="flex flex-col gap-2.5"
      >
        <input name="title" defaultValue={event.title} required className="input !min-h-10 text-sm" />
        <input type="hidden" name="event_date" value={event.event_date} />
        <div className="flex gap-2">
          <input type="time" name="start_time" defaultValue={event.start_time ?? ""} className="input !min-h-10 text-sm" />
          <input type="time" name="end_time" defaultValue={event.end_time ?? ""} className="input !min-h-10 text-sm" />
        </div>
        <select name="category" defaultValue={event.category} className="input !min-h-10 text-sm">
          {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input name="subject" defaultValue={event.subject ?? ""} placeholder="과목 (선택)" className="input !min-h-10 text-sm" />
        <select name="priority" defaultValue={event.priority} className="input !min-h-10 text-sm">
          <option value="high">중요도: 높음</option>
          <option value="normal">중요도: 보통</option>
          <option value="low">중요도: 낮음</option>
        </select>
        <textarea name="description" defaultValue={event.description ?? ""} placeholder="설명 (선택)" className="input text-sm" />
        <ColorPicker name="color" defaultValue={event.color ?? ""} />
        {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1 !min-h-9 text-sm">
            취소
          </button>
          <button disabled={pending} className="btn-primary flex-1 !min-h-9 text-sm">
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </Card>
  );
}
