"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TimetableRow } from "@/lib/schedule";

async function fetchTimetable(userId: string) {
  const supabase = createClient();
  const [{ data: template }, { data: overrides }] = await Promise.all([
    supabase.from("timetable_template").select("*"),
    supabase.from("timetable_overrides").select("*").eq("user_id", userId),
  ]);
  return {
    template: (template ?? []) as TimetableRow[],
    overrides: (overrides ?? []) as (TimetableRow & { user_id: string })[],
  };
}

export function useTimetableQuery(userId: string) {
  return useQuery({
    queryKey: ["timetable", userId],
    queryFn: () => fetchTimetable(userId),
    staleTime: 60_000,
  });
}

export function useSetOverrideMutation(userId: string) {
  const queryClient = useQueryClient();
  const key = ["timetable", userId];

  return useMutation({
    mutationFn: async (params: {
      dayOfWeek: number;
      period: number;
      subject: string;
      teacher: string;
      room: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("timetable_overrides").upsert(
        {
          user_id: userId,
          day_of_week: params.dayOfWeek,
          period: params.period,
          subject: params.subject || null,
          teacher: params.teacher || null,
          room: params.room || null,
        },
        { onConflict: "user_id,day_of_week,period" }
      );
      if (error) throw error;
      return params;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchTimetable>>>(key);
      if (previous) {
        const next = {
          ...previous,
          overrides: [
            ...previous.overrides.filter(
              (o) => !(o.day_of_week === params.dayOfWeek && o.period === params.period)
            ),
            {
              id: "optimistic",
              user_id: userId,
              day_of_week: params.dayOfWeek,
              period: params.period,
              subject: params.subject || null,
              teacher: params.teacher || null,
              room: params.room || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        };
        queryClient.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useResetOverrideMutation(userId: string) {
  const queryClient = useQueryClient();
  const key = ["timetable", userId];

  return useMutation({
    mutationFn: async ({ dayOfWeek, period }: { dayOfWeek: number; period: number }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("timetable_overrides")
        .delete()
        .eq("user_id", userId)
        .eq("day_of_week", dayOfWeek)
        .eq("period", period);
      if (error) throw error;
    },
    onMutate: async ({ dayOfWeek, period }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchTimetable>>>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          overrides: previous.overrides.filter(
            (o) => !(o.day_of_week === dayOfWeek && o.period === period)
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useResetAllOverridesMutation(userId: string) {
  const queryClient = useQueryClient();
  const key = ["timetable", userId];

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("timetable_overrides").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchTimetable>>>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, overrides: [] });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
