"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { newImagePath, CLASS_PHOTOS_BUCKET } from "@/lib/storage";

export function AnnouncementImageField({
  initialPreviewUrl,
}: {
  /** 수정 모드일 때 기존 이미지의 서명 URL (미리보기용) */
  initialPreviewUrl?: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null);
  const [imagePath, setImagePath] = useState<string>("");
  const [removed, setRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 만료되었습니다.");

      const compressed = await compressImage(file);
      const path = newImagePath(user.id, compressed.name);
      const { error: uploadError } = await supabase.storage
        .from(CLASS_PHOTOS_BUCKET)
        .upload(path, compressed, { contentType: compressed.type });

      if (uploadError) throw uploadError;
      setImagePath(path);
      setRemoved(false);
    } catch {
      setError("이미지 업로드에 실패했어요. 다시 시도해주세요.");
      setPreviewUrl(initialPreviewUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function onRemove() {
    setPreviewUrl(null);
    setImagePath("");
    setRemoved(true);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name="image_path" value={imagePath} />
      <input type="hidden" name="remove_image" value={removed ? "1" : ""} />

      {previewUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="첨부 이미지 미리보기" className="h-32 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
            aria-label="이미지 제거"
          >
            ×
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-xs font-semibold text-white">
              업로드 중...
            </div>
          )}
        </div>
      ) : (
        <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink-soft)]">
          <ImageIcon />
          이미지 첨부 (선택)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 16.5 8.5 12l3 3 3.5-4L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
