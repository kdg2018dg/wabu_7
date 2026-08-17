"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DisplayNameMode } from "@/lib/database.types";

export async function setRankingDisplayMode(mode: DisplayNameMode) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ display_name_mode: mode }).eq("role", "student");

  revalidatePath("/admin/settings");
  revalidatePath("/rankings");
  return { error: error?.message ?? null };
}

/**
 * 실제 서비스 시작 전에 테스트로 쌓인 데이터를 한 번에 정리하기 위한 관리자 전용 기능.
 * 공휴일 시드(holiday 카테고리)는 보존하고, 그 외 학생들이 만든 테스트 데이터만 지운다.
 * study-photos / class-photos 버킷의 실제 파일은 지우지 않으므로(용량은 남지만) 안전하다.
 */
export async function clearTestData() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const results = await Promise.all([
    supabase.from("study_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("calendar_events").delete().neq("category", "holiday"),
    supabase.from("announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("item_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("daily_period_notes").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
  ]);

  const error = results.find((r) => r.error)?.error?.message ?? null;

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: admin.id,
      action: "clear_test_data",
      target_type: "bulk",
      target_id: "all",
    });
  }

  revalidatePath("/", "layout");
  return { error };
}
