"use client";

import { useRef, useState, useTransition } from "react";
import { createAnnouncement } from "./actions";
import { Card } from "@/components/Card";
import { AnnouncementImageField } from "./AnnouncementImageField";

export function NewAnnouncementForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + 공지 작성하기
      </button>
    );
  }

  return (
    <Card className="p-4">
      <form
        key={formKey}
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            const res = await createAnnouncement(formData);
            if (res.error) setError(res.error);
            else {
              setError(null);
              setOpen(false);
              setFormKey((k) => k + 1); // 이미지 필드 내부 상태까지 완전히 초기화
            }
          })
        }
        className="flex flex-col gap-2.5"
      >
        <input name="title" placeholder="제목" required className="input !min-h-10 text-sm" />
        <textarea name="content" placeholder="내용" required className="input text-sm" rows={4} />
        <AnnouncementImageField />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="is_important" className="h-4 w-4" />
          중요 공지로 표시
        </label>
        {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 !min-h-10 text-sm">
            취소
          </button>
          <button disabled={pending} className="btn-primary flex-1 !min-h-10 text-sm">
            {pending ? "게시 중..." : "게시하기"}
          </button>
        </div>
      </form>
    </Card>
  );
}
