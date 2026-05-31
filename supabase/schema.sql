-- ============================================================
-- 강원도 소상공인 후기 게시판 — DB 스키마 + RLS
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

-- 1) reviews 테이블 -----------------------------------------
create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  nickname    text        not null check (char_length(nickname) between 1 and 20),  -- 작성자 닉네임 (가입 시 입력값)
  title       text        not null check (char_length(title) between 1 and 100),
  content     text        not null check (char_length(content) between 1 and 2000),
  rating      smallint    not null check (rating between 1 and 5),  -- 별점 5점 만점
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 정렬용 인덱스 (최신순 / 별점순)
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_rating_idx     on public.reviews (rating desc);

-- 2) updated_at 자동 갱신 트리거 -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- 3) RLS (Row Level Security) -------------------------------
alter table public.reviews enable row level security;

-- 읽기: 누구나 (비로그인 포함) 후기 목록/상세를 볼 수 있다
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
  on public.reviews
  for select
  using (true);

-- 작성: 로그인한 사용자가 본인 user_id 로만 작성 가능
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 수정: 본인 글만 수정 가능
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 삭제: 본인 글만 삭제 가능
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);
