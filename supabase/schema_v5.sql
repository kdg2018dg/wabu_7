-- ============================================================================
-- 7반 학급 운영센터 — 스키마 v5 (랭킹 버그 안전 재적용)
-- 관리자가 여전히 랭킹에 안 보인다면, schema_v3.sql이 이전에 정상 반영되지 않았을
-- 수 있습니다. 이 파일은 그 부분만 딱 떼어내서 다시 안전하게 적용합니다.
-- (이 파일 하나만 실행해도 되고, 몇 번을 실행해도 안전합니다)
-- ============================================================================

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

grant execute on function public.weekly_rankings(date, date) to authenticated;

-- 아래 쿼리로 함수가 실제로 role 필터 없이 정의되어 있는지 직접 확인할 수 있습니다.
-- (SQL Editor에서 이 파일과 별도로 실행해보세요)
-- select prosrc from pg_proc where proname = 'weekly_rankings';
-- 결과에 "where p.role" 문구가 없어야 정상입니다.
