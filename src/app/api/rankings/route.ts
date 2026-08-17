import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyRankings } from "@/lib/queries";

// GET /api/rankings?week=YYYY-MM-DD  (해당 날짜가 속한 주의 랭킹, 기본값: 이번 주)
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") ?? undefined;

  const supabase = await createClient();
  const result = await getWeeklyRankings(supabase, week);

  if (result.rows.length === 0 && result.rpcError) {
    // RPC 자체가 실패한 경우(함수 미존재, 권한 문제 등) 서버 로그에 남겨서
    // "랭킹이 그냥 비어 보이는" 상태와 "진짜 에러"를 구분할 수 있게 한다.
    console.error("[/api/rankings] weekly_rankings RPC error:", result.rpcError);
  }

  return NextResponse.json(result);
}
