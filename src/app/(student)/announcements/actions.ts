"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAnnouncement(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const imagePath = String(formData.get("image_path") || "") || null;

  const { error } = await supabase.from("announcements").insert({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    is_important: formData.get("is_important") === "on",
    image_path: imagePath,
    created_by: profile.id,
  });

  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const removeImage = formData.get("remove_image") === "1";
  const newImagePath = String(formData.get("image_path") || "") || null;

  const { error } = await supabase
    .from("announcements")
    .update({
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      is_important: formData.get("is_important") === "on",
      // 새 이미지가 업로드됐으면 그걸로 교체, "삭제" 체크했으면 null, 둘 다 아니면 기존 값 유지
      ...(newImagePath ? { image_path: newImagePath } : removeImage ? { image_path: null } : {}),
      updated_by: profile.id,
    })
    .eq("id", id);

  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function deleteAnnouncement(id: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
