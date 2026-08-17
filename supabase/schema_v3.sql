-- ============================================================================
-- 7반 학급 운영센터 — 스키마 v3
-- Supabase SQL Editor에서 schema.sql, schema_v2.sql 다음에 이어서 실행하세요.
-- (멱등 스크립트라 여러 번 실행해도 안전합니다)
-- ============================================================================

alter table public.calendar_events add column if not exists updated_by uuid references public.profiles(id);
alter table public.announcements add column if not exists updated_by uuid references public.profiles(id);
alter table public.item_requests add column if not exists rejection_reason text;
