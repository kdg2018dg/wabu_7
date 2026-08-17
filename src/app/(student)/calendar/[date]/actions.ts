"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addPeriodNote(params: {
  noteDate: string;
  period: number;
  content: string;
  imagePath: string | null;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("daily_period_notes").insert({
    note_date: params.noteDate,
    period: params.period,
    author_id: profile.id,
    content: params.content || null,
    image_path: params.imagePath,
  });

  revalidatePath(`/calendar/${params.noteDate}`);
  return { error: error?.message ?? null };
}

export async function deletePeriodNote(id: string, noteDate: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("daily_period_notes").delete().eq("id", id);

  revalidatePath(`/calendar/${noteDate}`);
  return { error: error?.message ?? null };
}
