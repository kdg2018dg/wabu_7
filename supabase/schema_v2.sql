-- ============================================================================
-- 7반 학급 운영센터 — 스키마 v2 (기존 schema.sql 적용 후 이걸 이어서 실행하세요)
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행합니다.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. roster 수정: 처음 예시로 넣었던 가짜 학번을 실제 학번으로 교체
-- ----------------------------------------------------------------------------
delete from public.roster where student_number in ('70101', '70102', '70103') and claimed = false;

insert into public.roster (student_number, name) values
  ('20703', '김도건'),
  ('20714', '손슬아')
on conflict (student_number) do nothing;

-- ----------------------------------------------------------------------------
-- 1. 특정 학번은 가입과 동시에 자동으로 관리자 권한 부여
-- ----------------------------------------------------------------------------
create or replace function public.auto_assign_admin()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.student_number in ('20703', '20714') then
    new.role := 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_assign_admin on public.profiles;
create trigger trg_auto_assign_admin
  before insert on public.profiles
  for each row execute function public.auto_assign_admin();

-- 이미 가입되어 있다면 즉시 승격
update public.profiles set role = 'admin' where student_number in ('20703', '20714');

-- ----------------------------------------------------------------------------
-- 2. calendar_events: 색상 필드 추가 + 'holiday' 카테고리 허용 + 전체 편집 개방
-- ----------------------------------------------------------------------------
alter table public.calendar_events add column if not exists color text;

alter table public.calendar_events drop constraint if exists calendar_events_category_check;
alter table public.calendar_events add constraint calendar_events_category_check
  check (category in ('exam','assessment','homework','supplies','mock_exam','school_event','holiday','other'));

drop policy if exists calendar_events_write on public.calendar_events;
drop policy if exists calendar_events_insert on public.calendar_events;
drop policy if exists calendar_events_update on public.calendar_events;
drop policy if exists calendar_events_delete on public.calendar_events;

-- 이제 로그인한 사용자라면 누구나 캘린더를 추가/수정/삭제할 수 있다 (관리자 전용 아님).
create policy calendar_events_insert on public.calendar_events for insert
  with check (auth.uid() is not null);
create policy calendar_events_update on public.calendar_events for update
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy calendar_events_delete on public.calendar_events for delete
  using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- 3. 시간표 기본 템플릿 (요일 1=월 ~ 5=금, 교시 1~7) — 관리자가 관리하는 "기준" 시간표
-- ----------------------------------------------------------------------------
create table if not exists public.timetable_template (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 1 and 5),
  period smallint not null check (period between 1 and 7),
  subject text,
  teacher text,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_of_week, period)
);

drop trigger if exists trg_updated_at on public.timetable_template;
create trigger trg_updated_at before update on public.timetable_template
  for each row execute function public.set_updated_at();

alter table public.timetable_template enable row level security;
drop policy if exists timetable_template_select on public.timetable_template;
create policy timetable_template_select on public.timetable_template for select using (true);
drop policy if exists timetable_template_write on public.timetable_template;
create policy timetable_template_write on public.timetable_template for all
  using (public.is_admin()) with check (public.is_admin());

-- 이미지 기준 기본 시간표 시드 (관리자가 나중에 자유롭게 수정 가능)
insert into public.timetable_template (day_of_week, period, subject, teacher, room) values
  (1,1,'물질과에너지','길혜정','207'), (2,1,'독서와작문','채희영','207'), (3,1,'미적분I','남기윤','207'), (4,1,'독서와작문','이은희','207'), (5,1,'스포츠생활2','김원호','207/체육관'),
  (1,2,'물질과에너지','길혜정','207'), (2,2,'영어II','백화진','207'), (3,2,'미적분I','남기윤','207'), (4,2,'독서와작문','이은희','207'), (5,2,'스포츠생활2','김원호','207/운동장'),
  (1,3,'독서와작문','채희영','207'), (2,3,'세포와물질대사','심세나','207'), (3,3,'영어II','구용모','207'), (4,3,'미적분I','남기윤','207'), (5,3,'역학과에너지','조주현','207'),
  (1,4,'확률과통계','김재형','207'), (2,4,'물질과에너지','길혜정','207'), (3,4,'영어II','구용모','207'), (4,4,'확률과통계','김재형','207'), (5,4,'역학과에너지','조주현','207'),
  (1,5,'스페인어회화','김수연','207/다목적실'), (4,5,'역학과에너지','조주현','207'),
  (1,6,'영어II','백화진','207'), (2,6,'확률과통계','김재형','207'), (3,6,'세포와물질대사','심세나','207'), (4,6,'스페인어회화','김수연','207/다목적실'),
  (1,7,'미적분I','남기윤','207'), (2,7,'확률과통계','김재형','207'), (3,7,'세포와물질대사','심세나','207'), (4,7,'스페인어회화','김수연','207/다목적실')
on conflict (day_of_week, period) do nothing;

-- ----------------------------------------------------------------------------
-- 4. 개인별 시간표 오버라이드 — 로그인한 학생이 자기 것만 자유롭게 커스터마이즈
-- ----------------------------------------------------------------------------
create table if not exists public.timetable_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 5),
  period smallint not null check (period between 1 and 7),
  subject text,
  teacher text,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week, period)
);

drop trigger if exists trg_updated_at on public.timetable_overrides;
create trigger trg_updated_at before update on public.timetable_overrides
  for each row execute function public.set_updated_at();

alter table public.timetable_overrides enable row level security;
drop policy if exists timetable_overrides_select on public.timetable_overrides;
create policy timetable_overrides_select on public.timetable_overrides for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists timetable_overrides_write on public.timetable_overrides;
create policy timetable_overrides_write on public.timetable_overrides for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. 날짜별·교시별 메모 (글 + 이미지) — 캘린더에서 날짜를 클릭했을 때 보이는 내용
-- ----------------------------------------------------------------------------
create table if not exists public.daily_period_notes (
  id uuid primary key default gen_random_uuid(),
  note_date date not null,
  period smallint not null check (period between 1 and 7),
  author_id uuid references public.profiles(id),
  content text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_daily_period_notes_date on public.daily_period_notes(note_date);

drop trigger if exists trg_updated_at on public.daily_period_notes;
create trigger trg_updated_at before update on public.daily_period_notes
  for each row execute function public.set_updated_at();

alter table public.daily_period_notes enable row level security;
drop policy if exists daily_period_notes_select on public.daily_period_notes;
create policy daily_period_notes_select on public.daily_period_notes for select using (true);
drop policy if exists daily_period_notes_insert on public.daily_period_notes;
create policy daily_period_notes_insert on public.daily_period_notes for insert
  with check (auth.uid() is not null);
drop policy if exists daily_period_notes_update on public.daily_period_notes;
create policy daily_period_notes_update on public.daily_period_notes for update
  using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists daily_period_notes_delete on public.daily_period_notes;
create policy daily_period_notes_delete on public.daily_period_notes for delete
  using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- 6. 공용 이미지 버킷 (시간표 메모 첨부 이미지) — 학급 전체가 볼 수 있는 비공개 버킷
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('class-photos', 'class-photos', false)
on conflict (id) do nothing;

drop policy if exists class_photos_insert on storage.objects;
create policy class_photos_insert on storage.objects for insert
  with check (bucket_id = 'class-photos' and auth.uid() is not null);

drop policy if exists class_photos_select on storage.objects;
create policy class_photos_select on storage.objects for select
  using (bucket_id = 'class-photos' and auth.uid() is not null);

drop policy if exists class_photos_delete on storage.objects;
create policy class_photos_delete on storage.objects for delete
  using (bucket_id = 'class-photos' and auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- 7. 2026년 하반기 공휴일 미리 등록 (한국천문연구원 특일정보 기준)
-- NOT EXISTS 방식으로 중복 방지 (유니크 제약을 걸지 않아 사용자가 만드는 일반
-- 일정과 절대 충돌하지 않는다 — 이전 버전의 버그 수정)
-- ----------------------------------------------------------------------------
alter table public.calendar_events drop constraint if exists calendar_events_date_title_unique;

insert into public.calendar_events (title, event_date, category, priority, color, description)
select v.title, v.event_date, v.category, v.priority, v.color, v.description
from (values
  ('광복절', '2026-08-15'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('광복절 대체공휴일', '2026-08-17'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('추석 연휴', '2026-09-24'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('추석', '2026-09-25'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('추석 연휴', '2026-09-26'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('개천절', '2026-10-03'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('개천절 대체공휴일', '2026-10-05'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('한글날', '2026-10-09'::date, 'holiday', 'high', '#e35a5a', null::text),
  ('성탄절', '2026-12-25'::date, 'holiday', 'high', '#e35a5a', null::text)
) as v(title, event_date, category, priority, color, description)
where not exists (
  select 1 from public.calendar_events c
  where c.event_date = v.event_date and c.title = v.title
);

-- ----------------------------------------------------------------------------
-- 8. profiles 조회 범위 확장 — 같은 반 학생끼리는 이름/학번 정도는 볼 수 있어야
-- 캘린더 메모 작성자 표시, 시간표 등 여러 화면이 정상 작동한다 (기존엔 본인/관리자만 조회 가능해 막혀 있었음)
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles for select
  using (auth.uid() is not null);
