"use client";

import { useRef, useState, useTransition } from "react";
import { updateAnnouncement, deleteAnnouncement } from "./actions";
import { Card, Pill } from "@/components/Card";
import type { Announcement } from "@/lib/database.types";

interface AnnouncementWithNames extends Announcement {
  updated_by_profile?: { name: string } | null;
}

export function AnnouncementCard({ announcement }: { announcement: AnnouncementWithNames }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <Card className="p-4">
        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              const res = await updateAnnouncement(announcement.id, formData);
              if (res.error) setError(res.error);
              else {
                setError(null);
                setEditing(false);
              }
            })
          }
          className="flex flex-col gap-2.5"
        >
          <input name="title" defaultValue={announcement.title} required className="input !min-h-10 text-sm" />
          <textarea name="content" defaultValue={announcement.content} required className="input text-sm" rows={4} />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="is_important" defaultChecked={announcement.is_important} className="h-4 w-4" />
            중요 공지로 표시
          </label>
          {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
          <div className="flex items-center gap-2">
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

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {announcement.is_important && <Pill tone="rose">중요</Pill>}
          <p className="text-sm font-bold">{announcement.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-[var(--color-brand)]">
            수정
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("이 공지를 삭제할까요?"))
                startTransition(async () => {
                  await deleteAnnouncement(announcement.id);
                });
            }}
            className="text-xs font-semibold text-[var(--color-ink-soft)]"
          >
            삭제
          </button>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm text-[var(--color-ink-soft)]">{announcement.content}</p>
      <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
        {new Date(announcement.published_at).toLocaleDateString("ko-KR")}
        {announcement.updated_by_profile?.name && ` · ${announcement.updated_by_profile.name}님이 마지막으로 수정`}
      </p>
    </Card>
  );
}
