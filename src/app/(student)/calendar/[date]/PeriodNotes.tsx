"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { newImagePath, getSignedImageUrl, CLASS_PHOTOS_BUCKET } from "@/lib/storage";
import { addPeriodNote, deletePeriodNote } from "./actions";
import type { DailyPeriodNote } from "@/lib/database.types";

interface NoteWithUrl extends DailyPeriodNote {
  imageUrl: string | null;
  authorName?: string;
}

export function PeriodNotes({
  noteDate,
  period,
  initialNotes,
  currentUserName,
}: {
  noteDate: string;
  period: number;
  initialNotes: NoteWithUrl[];
  currentUserName: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function onFileChange(f: File | null) {
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit() {
    if (!content.trim() && !file) return;
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    let imagePath: string | null = null;
    if (file) {
      const compressed = await compressImage(file);
      const path = newImagePath(user.id, compressed.name);
      const { error: uploadError } = await supabase.storage
        .from(CLASS_PHOTOS_BUCKET)
        .upload(path, compressed, { contentType: compressed.type });
      if (!uploadError) imagePath = path;
    }

    startTransition(async () => {
      await addPeriodNote({ noteDate, period, content, imagePath });
      const imageUrl = imagePath ? await getSignedImageUrl(supabase, imagePath, CLASS_PHOTOS_BUCKET) : null;
      setNotes((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          note_date: noteDate,
          period,
          author_id: user.id,
          content: content || null,
          image_path: imagePath,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imageUrl,
          authorName: currentUserName,
        },
      ]);
      setContent("");
      setFile(null);
      setPreviewUrl(null);
      setOpen(false);
      setUploading(false);
    });
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {notes.map((note) => (
        <div key={note.id} className="rounded-xl bg-[var(--color-canvas)] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {note.authorName && (
                <p className="mb-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">{note.authorName}</p>
              )}
              {note.content && <p className="whitespace-pre-line text-sm">{note.content}</p>}
            </div>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deletePeriodNote(note.id, noteDate);
                  setNotes((prev) => prev.filter((n) => n.id !== note.id));
                })
              }
              className="shrink-0 text-xs text-[var(--color-ink-soft)]"
            >
              삭제
            </button>
          </div>
          {note.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={note.imageUrl} alt="첨부 사진" className="mt-2 max-h-48 rounded-lg object-cover" />
          )}
        </div>
      ))}

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost !min-h-8 self-start px-3 text-xs">
          + 메모/사진 추가
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-line)] p-2.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이 교시에 대한 메모를 남겨보세요"
            className="input text-sm"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-line)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)]">
              <CameraIcon />
              {file ? "사진 선택됨" : "사진 첨부"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="첨부할 사진 미리보기" className="h-10 w-10 rounded-lg object-cover" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setContent("");
                onFileChange(null);
              }}
              className="btn-ghost flex-1 !min-h-8 text-xs"
            >
              취소
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={onSubmit}
              className="btn-primary flex-1 !min-h-8 text-xs"
            >
              {uploading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
