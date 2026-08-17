"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface PublicRequest {
  id: string;
  item_name: string;
  reason: string;
  estimated_price: number | null;
  status: string;
  created_at: string;
}

async function fetchItemRequestStats() {
  const supabase = createClient();
  const { data } = await supabase.rpc("item_requests_public");
  const grouped: Record<string, { count: number; status: string }> = {};
  ((data ?? []) as PublicRequest[]).forEach((r) => {
    if (!grouped[r.item_name]) grouped[r.item_name] = { count: 0, status: r.status };
    grouped[r.item_name].count += 1;
  });
  return grouped;
}

export function useItemRequestStatsQuery() {
  return useQuery({
    queryKey: ["item-request-stats"],
    queryFn: fetchItemRequestStats,
    staleTime: 30_000,
  });
}

interface MyRequest {
  id: string;
  item_name: string;
  reason: string;
  estimated_price: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

async function fetchMyItemRequests() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("item_requests")
    .select("id, item_name, reason, estimated_price, status, rejection_reason, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as MyRequest[];
}

export function useMyItemRequestsQuery() {
  return useQuery({
    queryKey: ["my-item-requests"],
    queryFn: fetchMyItemRequests,
    staleTime: 30_000,
  });
}

export function useSubmitItemRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { itemName: string; reason: string; price: string }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");

      const { error } = await supabase.from("item_requests").insert({
        author_id: user.id,
        item_name: params.itemName,
        reason: params.reason,
        estimated_price: params.price ? Number(params.price) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-request-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-item-requests"] });
    },
  });
}
