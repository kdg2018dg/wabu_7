"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const eventDate = String(formData.get("event_date") || "");

  const { error } = await supabase.from("calendar_events").insert({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    event_date: eventDate,
    start_time: String(formData.get("start_time") || "") || null,
    end_time: String(formData.get("end_time") || "") || null,
    category: String(formData.get("category") || "other"),
    subject: String(formData.get("subject") || "") || null,
    priority: String(formData.get("priority") || "normal"),
    color: String(formData.get("color") || "") || null,
    created_by: profile.id,
  });

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${eventDate}`);
  revalidatePath("/");
  revalidatePath("/schedule");
  return { error: error?.message ?? null };
}

export async function updateEvent(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const eventDate = String(formData.get("event_date") || "");

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || null,
      event_date: eventDate,
      start_time: String(formData.get("start_time") || "") || null,
      end_time: String(formData.get("end_time") || "") || null,
      category: String(formData.get("category") || "other"),
      subject: String(formData.get("subject") || "") || null,
      priority: String(formData.get("priority") || "normal"),
      color: String(formData.get("color") || "") || null,
      updated_by: profile.id,
    })
    .eq("id", id);

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${eventDate}`);
  revalidatePath("/");
  revalidatePath("/schedule");
  return { error: error?.message ?? null };
}

export async function deleteEvent(id: string, eventDate: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${eventDate}`);
  revalidatePath("/");
  revalidatePath("/schedule");
  return { error: error?.message ?? null };
}

export async function deleteEvents(ids: string[]) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().in("id", ids);

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/schedule");
  return { error: error?.message ?? null };
}
