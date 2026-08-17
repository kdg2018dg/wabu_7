"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteMyPendingSession(id: string) {
  await requireProfile();
  const supabase = await createClient();

  // RLS가 "본인 소유 + pending 상태"만 삭제를 허용하므로, 이미 승인/반려된 건은
  // 여기서 시도해도 서버에서 자동으로 거부된다 (0 rows affected).
  const { error } = await supabase.from("study_sessions").delete().eq("id", id).eq("status", "pending");

  revalidatePath("/study/history");
  revalidatePath("/");
  return { error: error?.message ?? null };
}
