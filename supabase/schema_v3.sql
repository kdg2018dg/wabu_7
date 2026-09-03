-- ============================================================================
-- 7반 학급 운영센터 — 스키마 v3
-- Supabase SQL Editor에서 schema.sql, schema_v2.sql 다음에 이어서 실행하세요.
-- (멱등 스크립트라 여러 번 실행해도 안전합니다)
-- ============================================================================

alter table public.calendar_events add column if not exists updated_by uuid references public.profiles(id);
alter table public.announcements add column if not exists updated_by uuid references public.profiles(id);
alter table public.item_requests add column if not exists rejection_reason text;

-- ----------------------------------------------------------------------------
-- 9. weekly_rankings 함수 수정: 관리자도 랭킹에 포함
-- 기존엔 role='student' 인 사람만 집계해서, 자동으로 관리자가 되는 학번(20703/20714)이
-- 공부시간을 인증해도 랭킹에 전혀 반영되지 않는 버그가 있었다. 관리자도 실제로는
-- 공부하는 학생이므로 전체 로그인 사용자를 대상으로 집계하도록 수정한다.
-- ----------------------------------------------------------------------------
create or replace function public.weekly_rankings(week_start date, week_end date)
returns table (
  user_id uuid,
  name text,
  student_number text,
  display_name_mode text,
  nickname text,
  total_minutes bigint
)
language sql
security definer
stable
as $$
  select
    p.id as user_id,
    p.name,
    p.student_number,
    p.display_name_mode,
    p.nickname,
    coalesce(sum(s.duration_minutes), 0) as total_minutes
  from public.profiles p
  left join public.study_sessions s
    on s.user_id = p.id
    and s.status = 'approved'
    and s.study_date between week_start and week_end
  group by p.id, p.name, p.student_number, p.display_name_mode, p.nickname
  order by total_minutes desc;
$$;
