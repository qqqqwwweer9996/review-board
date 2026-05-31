-- ============================================================
-- reviews 테이블에 작성자 닉네임 컬럼 추가
--
-- reviews 테이블을 이미 만든 경우(= 처음 schema.sql 실행) 이 파일만
-- Supabase SQL Editor 에서 실행하세요. (테이블을 새로 만든다면 schema.sql
-- 에 이미 nickname 이 포함되어 있으므로 이 파일은 필요 없습니다.)
-- ============================================================

-- 빈 테이블/기존 데이터 모두 안전하도록 임시 기본값을 주고 추가한다.
alter table public.reviews
  add column if not exists nickname text not null default '익명'
    check (char_length(nickname) between 1 and 20);

-- 앞으로의 INSERT 는 항상 닉네임을 명시하므로 기본값은 제거.
alter table public.reviews
  alter column nickname drop default;
