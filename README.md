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
작성하신 내용은 개발자나 면접관이 보기에 설계의 깊이와 보안 의식(Defense in Depth)이 잘 드러나는 매우 훌륭한 요약입니다.

문맥의 흐름을 조금 더 부드럽게 다듬고, 기술적인 전문성은 유지하면서 문장의 가독성을 높인 버전을 제안해 드립니다. 프로젝트 문서(Readme)나 포트폴리오에 바로 넣으실 수 있도록 두 가지 톤으로 준비했습니다.

---
## 5. 핵심 구현 포인트
### 1. URL 기반의 단일 상태원(SSOT) 관리
 

 검색어, 정렬 기준, 정렬 방향 등 모든 조회 조건을 `?q=&sort=&order=` 형태의 쿼리 스트링으로 관리합니다. Server Component가 이 URL을 기반으로 DB를 직접 조회하므로, **새로고침·링크 공유·뒤로가기** 시에도 UI 상태와 서버 데이터가 완벽히 일치하며 자연스럽게 동작합니다.
### 2. 본인 글 수정/삭제를 위한 3중 방어 메커니즘
 

 프론트엔드부터 DB까지 세 단계의 방어선으로 데이터 권한을 철저히 보호합니다.
 * **UI 가드:** 클라이언트 단에서 본인 글(`isOwner`)일 때만 수정/삭제 버튼을 노출합니다.
 * **서버 검증:** Server Action에서 수정/삭제 요청 처리 시, 조건절에 `user_id`를 강제하여 타인의 접근을 막습니다 (`.eq("user_id", user.id)`).
 * **DB RLS (최종 방어선):** 데이터베이스 레벨의 Row Level Security 정책으로 최종 차단합니다. 이를 통해 클라이언트나 API 요청을 우회하더라도 타인의 데이터를 절대 변경할 수 없도록 설계했습니다.
 
 
 ### 3. 서버 중심의 데이터 검증 및 신뢰성 확보


 클라이언트의 입력값은 언제든 변조될 수 있다는 가정하에 개발했습니다. 폼 데이터(제목·내용 길이, 별점 범위 등)는 Server Action에서 재검증한 후, DB의 `CHECK` 제약 조건으로 한 번 더 안전하게 보호합니다. 특히 **작성자 닉네임은 클라이언트 폼 값이 아닌 서버 세션에서 직접 주입**하여 작성자 위조 가능성을 원천 차단했습니다.
 ### 4. 경로 기반의 스토리지 권한 제어


 업로드 파일은 `<userId>/파일명` 구조로 저장되며, Storage RLS를 통해 본인 ID로 된 폴더에만 파일 업로드/삭제가 가능하도록 제한합니다 (`(foldername)[1] = auth.uid()`). 또한, Server Action 단계에서 이미지 URL이 자체 버킷의 Public 경로인지 화이트리스트 검증을 거쳐 악성 URL 주입을 방지합니다.
 ### 5. 디바운스(Debounce) 기반의 실시간 검색 UI


 사용자의 타이핑이 멈춘 후 300ms 뒤에 URL을 갱신하여 서버 부하를 최소화했습니다. 이때 검색어가 바뀔 때마다 브라우저 기록이 불필요하게 쌓이지 않도록 `router.push` 대신 `router.replace`를 사용하여 부드러운 UX를 제공합니다.
 ### 6. 웹 접근성(Accessibility) 준수


모든 사용자가 서비스를 이용할 수 있도록 접근성을 고려했습니다. 별점 입력 컴포넌트는 `radiogroup`과 `radio` 역할을 부여하고 화살표 키 조작을 지원하며, 회원가입 폼은 에러 발생 시 `aria-invalid` 처리와 라이브 리전을 통한 에러 메시지 낭독, 키보드 포커스 이동을 완벽히 지원합니다.
 ### 7. SSR 기반의 안정적인 세션 관리
 

 Next.js 미들웨어가 매 요청마다 `getUser()`를 통해 토큰을 자동으로 갱신(Refresh)하여 로그인 상태를 안정적으로 유지합니다. 만약 환경 변수가 누락되거나 인증 오류가 발생하더라도, 개별 에러 바운더리를 통해 서비스 전체가 크래시되지 않도록 방어 코드를 작성했습니다.
