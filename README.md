# 강원도 소상공인 후기 게시판

Next.js 14 기반 소상공인 후기 게시판 서비스입니다.
이메일 인증, 후기 CRUD(작성/수정/삭제), 동적 정렬(최신순/별점순 + 오름/내림차순),
실시간 검색(제목/내용), 사진 업로드, 모바일 우선 반응형 UI를 제공합니다.
백엔드는 Supabase(Postgres + Auth + Storage), 배포는 Vercel을 사용하며,
별도 상태관리·폼 라이브러리 없이 Next.js 기본기만으로 구성해
**runs-alone(최소 의존성) 유지보수 정책**을 따릅니다.

---

## 1. 요구사항 → 구현

| 요구사항 | 구현 |
|---------|------|
| **Next.js 14 + Supabase** | App Router + Server Components/Server Actions 기반. `@supabase/ssr`로 서버·클라이언트·미들웨어 3종 클라이언트를 구성하고 쿠키로 세션을 유지 (`src/lib/supabase/*`). |
| **후기 작성 (제목, 내용, 별점 5점 만점)** | `/reviews/new`의 `ReviewForm` → Server Action `createReview`. 제목·내용 길이와 별점(1~5 정수)을 **서버에서 재검증**, DB에도 `CHECK (rating between 1 and 5)` 제약. 별점은 클릭/호버/키보드로 고르는 `StarRatingInput`. |
| **후기 목록 (최신순, 별점순)** | 홈(`/`)이 곧 목록 (Server Component). `?sort=latest\|rating` + `?order=asc\|desc`로 정렬 기준·방향을 모두 URL에 반영. 별점순 동점은 최신순을 보조키로 사용. `created_at`/`rating` 인덱스로 정렬 최적화. |
| **검색 기능 (제목/내용)** | Postgres `ilike` 부분 일치(대소문자 무시)를 제목 OR 내용에 적용 (`title.ilike.%q%,content.ilike.%q%`). 입력창은 **디바운스(300ms) 실시간 검색** — "속"만 쳐도 자동 필터링되며 상태는 `?q=`로 URL에 보존. |
| **로그인 (Supabase Auth, 이메일/OAuth)** | Supabase Auth **이메일/비밀번호** 방식. 회원가입(`SignupForm`)은 실시간 유효성 검증·비밀번호 강도 미터·약관 동의 포함, 로그인/로그아웃은 Server Action. 미들웨어가 매 요청 세션을 갱신. |
| **본인 작성 후기만 수정/삭제** | **3중 방어**: ① UI에서 본인 글에만 수정/삭제 버튼 노출 ② Server Action에서 `.eq("user_id", user.id)` ③ **DB RLS 정책**이 최종 차단(UI/쿼리를 우회해도 막힘). |
| **반응형 디자인 (모바일 우선)** | Tailwind mobile-first. 목록 1열→`sm:`2열, 검색+정렬 세로→가로, 헤더 sticky, 폼 입력 `text-base`(iOS 자동 확대 방지) 등 모바일 기준으로 작성 후 데스크탑을 확장. |

> 추가 구현: **사진 업로드**(Supabase Storage), **마이페이지**(본인 글 + 작성수·평균 별점).

---

## 2. 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | **Next.js 14** (App Router, Server Components, Server Actions) |
| 언어 | **TypeScript** |
| 스타일 | **Tailwind CSS** (mobile-first) |
| 백엔드 | **Supabase** — Postgres(DB) · Auth(이메일 인증) · Storage(이미지) |
| 보안 | **Row Level Security (RLS)** — 본인 글만 수정/삭제, Storage는 본인 폴더만 업로드 |
| 인증 연동 | **@supabase/ssr** (쿠키 기반 SSR 세션) |
| 배포 | **Vercel** (GitHub 연동 자동 배포) |
| 런타임 | Node.js 18.17+ |

> **runs-alone 정책**: 런타임 의존성은 `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr` 뿐입니다. 상태관리·폼·검증 라이브러리를 추가하지 않고 Next.js/React 기본 기능만 사용합니다.

---

## 3. 실행 방법

### 3-1. 사전 준비
- Node.js 18.17 이상
- Supabase 계정 ([supabase.com](https://supabase.com))

### 3-2. 의존성 설치
```bash
npm install
```

### 3-3. Supabase 프로젝트 생성 & DB 구성
1. Supabase에서 새 프로젝트 생성 (Region: `Northeast Asia (Seoul)` 권장)
2. **Authentication → Sign In/Providers → Email** 활성화
   - 데모/테스트 편의를 위해 **"Confirm email" 옵션 OFF** 권장 (가입 즉시 로그인)
3. **SQL Editor**에서 아래 SQL을 순서대로 실행

```sql
-- (1) 테이블 + RLS  (supabase/schema.sql)
create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  nickname    text        not null check (char_length(nickname) between 1 and 20),
  title       text        not null check (char_length(title) between 1 and 100),
  content     text        not null check (char_length(content) between 1 and 2000),
  rating      smallint    not null check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_rating_idx     on public.reviews (rating desc);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- RLS: 읽기 전체 허용 / 작성·수정·삭제는 본인만
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated using (auth.uid() = user_id);

-- (2) 사진 업로드용 컬럼 + Storage  (supabase/migrations/0002_add_image_url.sql)
alter table public.reviews add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

drop policy if exists "review_images_public_read" on storage.objects;
create policy "review_images_public_read" on storage.objects
  for select using (bucket_id = 'review-images');

drop policy if exists "review_images_insert_own" on storage.objects;
create policy "review_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "review_images_delete_own" on storage.objects;
create policy "review_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

> 위 SQL은 `supabase/` 폴더에 파일로도 제공됩니다.
> - `supabase/schema.sql` — 테이블 + RLS (필수)
> - `supabase/migrations/0001_add_nickname.sql` — 닉네임 컬럼
> - `supabase/migrations/0002_add_image_url.sql` — 이미지 컬럼 + Storage
> - `supabase/seed_cleanup.sql` — 테스트 데이터 초기화(선택)

### 3-4. 환경변수 설정
프로젝트 루트에 `.env.local` 생성 (`.env.local.example` 참고).
값은 Supabase 대시보드 **Project Settings → API**에서 복사합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> `anon key`는 브라우저에 노출되는 공개 키이며, 실제 데이터 보호는 RLS가 담당합니다.

### 3-5. 개발 서버 실행
```bash
npm run dev      # http://localhost:3000
```

### 3-6. 프로덕션 빌드
```bash
npm run build
npm start
```

### 3-7. Vercel 배포
1. GitHub 저장소를 Vercel에 Import
2. **Settings → Environment Variables**에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록 (로컬 `.env.local`과 동일)
3. Deploy → 이후 푸시마다 자동 재배포

---

## 4. 프로젝트 구조

```
gangwon-review-board/
├─ src/
│  ├─ middleware.ts                 # 모든 요청에서 Supabase 세션 갱신
│  ├─ app/
│  │  ├─ layout.tsx                 # 공통 레이아웃 + 헤더
│  │  ├─ page.tsx                   # 홈 = 후기 목록 (검색·정렬, Server Component)
│  │  ├─ globals.css                # Tailwind & 전역 스타일
│  │  ├─ login/page.tsx             # 로그인
│  │  ├─ signup/page.tsx            # 회원가입
│  │  ├─ mypage/page.tsx            # 마이페이지 (본인 글 + 통계)
│  │  ├─ auth/actions.ts            # 로그인/로그아웃 Server Action
│  │  └─ reviews/
│  │     ├─ page.tsx                # /reviews → / 리다이렉트(호환용)
│  │     ├─ actions.ts              # 후기 CRUD Server Action (+ 입력 검증)
│  │     ├─ new/page.tsx            # 후기 작성
│  │     └─ [id]/
│  │        ├─ page.tsx             # 후기 상세 (본인 글이면 수정/삭제 노출)
│  │        └─ edit/page.tsx        # 후기 수정
│  ├─ components/
│  │  ├─ Header.tsx                 # 로그인 상태별 네비게이션
│  │  ├─ ReviewCard.tsx             # 목록 카드 (썸네일 포함)
│  │  ├─ ReviewForm.tsx             # 작성/수정 공용 폼
│  │  ├─ ReviewListControls.tsx     # 실시간 검색 + 정렬 토글 (URL 동기화)
│  │  ├─ StarRating.tsx             # 별점 표시(읽기 전용)
│  │  ├─ StarRatingInput.tsx        # 별점 입력(클릭/호버/키보드)
│  │  ├─ ImageUploadField.tsx       # 사진 업로드(Storage 직접 업로드 + 미리보기)
│  │  └─ signup/                    # 회원가입 폼 구성요소(검증·강도미터·약관 등)
│  ├─ hooks/useSignupForm.ts        # 회원가입 폼 상태/검증 훅
│  ├─ utils/validation.ts           # 이메일·비밀번호·닉네임 검증 로직
│  ├─ types/signup.ts               # 회원가입 도메인 타입
│  └─ lib/
│     ├─ types.ts                   # Review / 정렬 옵션 타입
│     └─ supabase/
│        ├─ client.ts               # 브라우저용 클라이언트
│        ├─ server.ts               # 서버용 클라이언트(쿠키 세션)
│        └─ middleware.ts           # 세션 갱신 로직
├─ supabase/
│  ├─ schema.sql                    # 테이블 + RLS
│  ├─ migrations/0001_add_nickname.sql
│  ├─ migrations/0002_add_image_url.sql
│  └─ seed_cleanup.sql
├─ .env.local.example
├─ tailwind.config.ts
└─ package.json
```

---

## 5. 구현 포인트

### URL을 단일 상태원(Single Source of Truth)으로
검색어·정렬 기준·방향을 전부 `?q=&sort=&order=` 쿼리스트링에 담습니다.
Server Component가 그 값으로 DB를 조회하므로 **새로고침·링크 공유·뒤로가기**가
모두 자연스럽게 동작하고, 클라이언트 상태와 서버 데이터가 어긋나지 않습니다.

### 본인 글 수정/삭제 — 3중 방어
1. **UI 가드** — 상세 페이지에서 `isOwner`일 때만 수정/삭제 버튼 노출
2. **쿼리 조건** — Server Action에서 `update/delete` 시 `.eq("user_id", user.id)`
3. **RLS** — DB 정책이 최종 차단. UI나 API를 우회해도 남의 글은 못 건드립니다.

→ 진짜 방어선은 DB(RLS)에 있고, 클라이언트는 신뢰하지 않습니다.

### 클라이언트 입력은 서버에서 다시 검증
폼의 모든 값(제목·내용 길이, 별점 1~5)을 Server Action에서 재검증하고,
DB의 `CHECK` 제약으로 한 번 더 막습니다. **닉네임은 폼 값이 아니라 서버가
세션에서 직접 결정**해 작성자 위조를 차단합니다.

### 사진 업로드 — 경로 기반 권한
파일을 `<userId>/파일명`으로 저장하고, Storage RLS가 `(foldername)[1] = auth.uid()`를
검사해 **본인 폴더에만 업로드/삭제**할 수 있게 합니다. 또한 Server Action에서
이미지 URL이 우리 버킷의 public 경로인지 화이트리스트로 검증해 임의 URL 주입을 막습니다.

### 실시간 검색 (디바운스)
타이핑이 멈춘 뒤 300ms 후 URL에 반영하고, 글자마다 히스토리가 쌓이지 않도록
`router.replace`를 사용합니다. 매 입력마다 요청을 보내지 않아 부드럽고 부하가 적습니다.

### 접근성
별점 입력은 `radiogroup`/`radio` 역할과 화살표 키 조작을 지원하고,
회원가입 폼은 `aria-invalid`·라이브 리전 에러·키보드 포커스 이동을 갖췄습니다.

### 세션 관리 (SSR)
미들웨어가 매 요청에서 `getUser()`로 토큰을 갱신해 로그인 상태를 유지하고,
환경변수가 없거나 인증 오류가 나도 사이트 전체가 죽지 않도록 방어 처리했습니다.

### runs-alone (최소 의존성)
상태관리/폼/검증 라이브러리를 일절 추가하지 않고 Next.js·React 기본기로만
구현해, 의존성이 적고 유지보수·업그레이드가 단순합니다.
