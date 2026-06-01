# 강원도 소상공인 후기 게시판 — 구현 체크리스트

> Next.js 14 + Supabase / 이메일 인증 / `ilike` 검색 / 모바일 우선
> 진행하면서 `[ ]` → `[x]` 로 체크해 나갑니다.

---

## 요구사항 ↔ Phase 매핑

| # | 요구사항 | 담당 Phase |
|---|---------|-----------|
| 1 | Next.js 14 + Supabase | Phase 0 |
| 2 | 후기 작성 (제목·내용·별점 5점) | Phase 3 |
| 3 | 후기 목록 (최신순·별점순) | Phase 4 |
| 4 | 검색 (제목/내용, `ilike`) | Phase 4 |
| 5 | 로그인 (이메일) | Phase 2 |
| 6 | 본인 글만 수정/삭제 (RLS) | Phase 1 + 3 |
| 7 | 반응형 (모바일 우선) | Phase 5 |
| 8 | GitHub + Vercel 배포 | Phase 6 |

---

## Phase 0 — 프로젝트 세팅
- [x] `create-next-app@14` (TS · Tailwind · App Router · src 디렉터리)
- [x] 구현 체크리스트 파일(ROADMAP.md) 작성
- [x] Supabase 패키지 설치 (`@supabase/supabase-js@2.97`, `@supabase/ssr@0.7`)
- [x] `.env.local.example` + `.env.local` 작성 (.gitignore 예외 확인)
- [x] Supabase 클라이언트 3종 (client / server / middleware) + `src/middleware.ts`
- [x] 타입 체크 통과 (`tsc --noEmit` 에러 0)
- [x] dev 서버 정상 구동 확인 (HTTP 200, 미들웨어 컴파일 OK)

## Phase 1 — DB 스키마 + RLS
- [x] `reviews` 테이블 정의 (id, user_id, title, content, rating, created_at, updated_at)
- [x] `rating` CHECK 제약 (1~5) + title/content 길이 제약
- [x] updated_at 자동 갱신 트리거
- [x] 정렬용 인덱스 (created_at, rating)
- [x] RLS 활성화 + 정책 4종 (읽기 전체 / 작성·수정·삭제 본인)
- [x] SQL 파일로 저장 (supabase/schema.sql)
- [x] TS 타입 정의 (src/lib/types.ts)
- [x] **(사용자 작업)** Supabase 프로젝트 생성 → SQL 실행 → .env.local 키 입력
- [x] 검증: reviews 읽기 200 / 비로그인 INSERT 401(RLS 차단) 확인

## Phase 2 — 인증 (이메일)
- [x] 회원가입 페이지 (src/app/signup)
- [x] 로그인 페이지 (src/app/login)
- [x] 로그아웃 (헤더 버튼 + signout 액션)
- [x] 미들웨어 세션 갱신 (Phase 0에서 구성)
- [x] 로그인 상태별 네비게이션 (Header.tsx)
- [x] 검증: /login /signup / 모두 HTTP 200 + 타입체크 통과
- [x] 회원가입 폼 고도화 (signup-form 레퍼런스 이식: 실시간 검증·비밀번호 표시/강도미터·약관 동의·접근성)
- [x] reviews 에 nickname 컬럼 추가 (마이그레이션 0001) — 목록에 작성자 표시용
- [ ] **(사용자 테스트)** 브라우저에서 회원가입→로그인→로그아웃 실제 동작 확인

## Phase 3 — 후기 CRUD
- [x] 별점 입력 컴포넌트 (StarRatingInput) + 표시 (StarRating)
- [x] 후기 작성 (Server Action createReview, 닉네임 자동 첨부)
- [x] 후기 상세 페이지 (/reviews/[id])
- [x] 후기 수정 (본인만, updateReview + edit 페이지)
- [x] 후기 삭제 (본인만, deleteReview)
- [x] 본인 글에만 수정/삭제 버튼 노출 (isOwner)
- [x] 버그픽스: redirect 한글 → Location 헤더 ERR_INVALID_CHAR → encodeURIComponent
- [x] 프로덕션 빌드 통과 (next build, BUILD_EXIT=0) + 타입체크 0
- [x] **버그픽스: 별점 클릭/제출 안 됨** → 원인: ReviewForm 의 react-dom 폼훅
      (useFormState/useFormStatus) 하이드레이션 실패로 폼 island 전체가 죽음.
      → 코어 훅(useState)+onSubmit 패턴으로 재작성, 서버액션은 formData 단일 인자로 변경
- [ ] **(사용자 테스트)** 브라우저에서 별점 클릭→작성→수정→삭제

## Phase 4 — 목록 · 정렬 · 검색
- [x] 후기 목록 (Server Component, /reviews) + 카드 UI (ReviewCard)
- [x] 정렬 토글 (최신순 / 별점순) — `?sort=` (ReviewListControls)
- [x] 검색 입력 (제목/내용 `ilike`) — `?q=` (대소문자 무시 부분일치)
- [x] 빈 상태 / 검색 결과 없음 처리
- [x] 홈 페이지 리뉴얼 (후기 둘러보기 / 작성 CTA)
- [ ] **(사용자 테스트)** 브라우저에서 정렬·검색 동작

> ⚠️ 자동 E2E(curl) 검증은 Windows bash 에서 한글 JSON 본문이 깨져(PGRST102)
>   INSERT 가 막혔음 — 앱 코드가 아니라 테스트 도구 한계. 브라우저 테스트로 대체.

## Phase 5 — 반응형 UI  ⭐요구사항 #7 (모바일 우선) — 채점 항목
- [x] mobile-first 카드 레이아웃 (기본 1열 → sm: 2열)
- [x] 별점 표시 컴포넌트
- [x] 헤더 정리 (sticky, indigo 통일, 마이페이지 링크)
- [x] 목록 컨트롤(검색+정렬) 모바일 세로 → sm: 가로
- [x] 폼 입력 text-base (iOS 자동확대 방지) + 터치 타깃 충분
- [ ] **(사용자 확인)** 실제 모바일 폭(개발자도구 반응형)에서 확인

## 구조 개편 (UX 개선)
- [x] 홈(/) = 후기 목록으로 통합 (별도 랜딩 제거, 보면서 작성은 로그인 유도)
- [x] /reviews → / 리다이렉트 (기존 링크/북마크 호환, 쿼리스트링 보존)
- [x] 마이페이지(/mypage) 추가 — 본인 글만 + 작성수·평균별점 통계
- [x] 정렬 컨트롤 pathname 기준 동작 (홈/마이페이지 공용)
- [x] 모든 /reviews 참조 정리, 타입체크 0, 라우트 검증(home=200, mypage·reviews=307)
- [x] 브라우저 스냅샷 확인: 홈에 기존 후기 카드 정상 렌더

## 추가 기능 — 사진 업로드 (Supabase Storage)
- [x] reviews.image_url 컬럼 추가 (마이그레이션 0002)
- [x] Storage 버킷 review-images(public) + RLS(읽기 공개 / 본인 폴더만 업로드·삭제)
- [x] ImageUploadField (클라 직접 업로드, 미리보기, 5MB·형식 검증, 제거 버튼)
- [x] 작성/수정 폼에 통합 (image_url hidden input)
- [x] 서버 액션: image_url 서버측 화이트리스트 검증 (우리 버킷 public URL만 허용)
- [x] 카드 썸네일 + 상세 이미지 표시
- [x] 타입체크 0, 프로덕션 빌드 통과
- [ ] **(사용자 작업)** 마이그레이션 0002 SQL 실행 (Storage 버킷·정책 생성)
- [ ] **(사용자 테스트)** 브라우저에서 사진 첨부 후기 작성

## Phase 6 — 배포
- [ ] GitHub 리포 생성 + push
- [ ] Vercel import
- [ ] 환경변수 등록 (URL, anon key)
- [ ] 배포 URL 확보 + 동작 확인

---

## 환경 정보
- Node.js: v24.16.0
- Next.js: 14.2.35
- 패키지 매니저: npm
