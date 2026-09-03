-- ============================================================================
-- 7반 학급 운영센터 — 스키마 v4
-- Supabase SQL Editor에서 schema.sql ~ schema_v3.sql 다음에 이어서 실행하세요.
-- (멱등 스크립트라 여러 번 실행해도 안전합니다)
-- ============================================================================

-- 공지사항에 이미지 첨부 기능 추가 (교시별 메모와 같은 class-photos 버킷을 재사용)
alter table public.announcements add column if not exists image_path text;
