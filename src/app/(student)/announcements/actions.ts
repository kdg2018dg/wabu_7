"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAnnouncement(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    is_important: formData.get("is_important") === "on",
    created_by: profile.id,
  });

  revalidatePath("/announcements");
  revalidatePath("/");
  return { error: error?.message ?? null };
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update({
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      is_important: formData.get("is_important") === "on",
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
