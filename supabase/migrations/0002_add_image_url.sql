-- ============================================================
-- reviews 테이블에 이미지 URL 컬럼 추가 + Storage 버킷/정책 구성
-- Supabase SQL Editor 에서 실행하세요.
-- ============================================================

-- 1) reviews.image_url 컬럼 (선택 항목이므로 nullable)
alter table public.reviews
  add column if not exists image_url text;

-- 2) Storage 버킷 생성 (공개 읽기). 이미 있으면 무시.
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- 3) Storage RLS 정책
--    - 읽기: 누구나 (public 버킷)
--    - 업로드/삭제: 로그인 사용자가 본인 폴더(<uid>/...)에만
drop policy if exists "review_images_public_read" on storage.objects;
create policy "review_images_public_read"
  on storage.objects for select
  using (bucket_id = 'review-images');

drop policy if exists "review_images_insert_own" on storage.objects;
create policy "review_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "review_images_delete_own" on storage.objects;
create policy "review_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
