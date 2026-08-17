"use client";

import { useQuery } from "@tanstack/react-query";

export interface RankingsResponse {
  rows: { user_id: string; displayName: string; totalMinutes: number; rank: number }[];
  classTotal: number;
  weekStart: string;
  weekEnd: string;
}

async function fetchRankings(week?: string): Promise<RankingsResponse> {
  const url = week ? `/api/rankings?week=${week}` : "/api/rankings";
  const res = await fetch(url);
  if (!res.ok) throw new Error("랭킹을 불러오지 못했어요.");
  return res.json();
}

export function useRankingsQuery(week?: string) {
  return useQuery({
    queryKey: ["rankings", week ?? "current"],
    queryFn: () => fetchRankings(week),
    staleTime: 30_000,
  });
}
