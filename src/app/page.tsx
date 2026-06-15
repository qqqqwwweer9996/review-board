import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewListControls } from "@/components/ReviewListControls";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review, SortOption, OrderOption } from "@/lib/types";

// 검색/정렬 결과가 항상 최신 DB 를 반영하도록 정적 캐시를 끈다.
export const dynamic = "force-dynamic";

/**
 * 홈 = 후기 목록 페이지 (Server Component).
 *
 * 검색어/정렬 상태를 전부 URL searchParams(?q=&sort=&order=)로 받는다.
 * → 서버에서 그 값으로 DB 를 조회하므로 새로고침·공유·뒤로가기가 자연스럽고,
 *   클라이언트 상태와 서버 데이터가 어긋날 일이 없다.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; order?: string };
}) {
  const supabase = createClient();
  // 로그인 여부에 따라 "후기 작성" 버튼의 목적지를 분기한다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // searchParams 는 신뢰할 수 없는 값이므로 화이트리스트로 정규화한다.
  const q = searchParams.q?.trim() ?? "";
  const sort: SortOption = searchParams.sort === "rating" ? "rating" : "latest";
  const order: OrderOption = searchParams.order === "asc" ? "asc" : "desc";
  const asc = order === "asc";

  let query = supabase.from("reviews").select("*");

  // 검색(요구사항 #4): 제목 OR 내용에 부분 일치. ilike = 대소문자 무시.
  if (q) {
    const pattern = `%${q}%`;
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  // 정렬(요구사항 #3): 별점순 / 최신순 + 오름/내림 방향.
  if (sort === "rating") {
    query = query
      .order("rating", { ascending: asc })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: asc });
  }

  const { data: reviews } = await query.returns<Review[]>();
  const list = reviews ?? [];

  // 히어로 통계: 검색과 무관하게 전체 집계를 따로 구한다.
  const { data: allForStats } = await supabase
    .from("reviews")
    .select("rating")
    .returns<{ rating: number }[]>();
  const stats = allForStats ?? [];
  const totalCount = stats.length;
  const avgRating =
    totalCount > 0
      ? (stats.reduce((s, r) => s + r.rating, 0) / totalCount).toFixed(1)
      : "0.0";

  const sortLabel =
    sort === "rating"
      ? `별점 ${asc ? "낮은" : "높은"}순`
      : `${asc ? "오래된" : "최신"}순`;

  return (
    <>
      {/* ===== 히어로 섹션 (풀폭) ===== */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500">
        {/* 장식용 블롭 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            강원도 소상공인 응원 프로젝트
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            강원도 가게,
            <br className="sm:hidden" /> 진짜 후기로 만나요
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-indigo-100 sm:text-lg">
            속초·강릉·춘천 곳곳의 작은 가게들. 직접 다녀온 사람들의 솔직한
            별점과 후기를 확인하고, 나의 경험도 남겨보세요.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                user
                  ? "/reviews/new"
                  : `/login?message=${encodeURIComponent("후기 작성은 로그인이 필요합니다.")}`
              }
              className="rounded-xl bg-white px-6 py-3 text-center font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              후기 작성하기
            </Link>
            <a
              href="#reviews"
              className="rounded-xl border border-white/40 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10"
            >
              후기 둘러보기
            </a>
          </div>

          {/* 통계 카드 */}
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <dt className="text-xs font-medium text-indigo-100">등록된 후기</dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {totalCount.toLocaleString()}
                <span className="ml-0.5 text-base font-medium text-indigo-100">건</span>
              </dd>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <dt className="text-xs font-medium text-indigo-100">평균 별점</dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                ★ {avgRating}
                <span className="ml-0.5 text-base font-medium text-indigo-100">/ 5</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ===== 후기 목록 섹션 ===== */}
      <section id="reviews" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              전체 후기
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {q ? `"${q}" 검색 결과 ` : ""}
              {list.length}건 · {sortLabel}
            </p>
          </div>
          <Link
            href={
              user
                ? "/reviews/new"
                : `/login?message=${encodeURIComponent("후기 작성은 로그인이 필요합니다.")}`
            }
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            후기 작성
          </Link>
        </div>

        {/* 검색 + 정렬 컨트롤 */}
        <div className="mb-6">
          <ReviewListControls />
        </div>

        {/* 목록 */}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center">
            <p className="text-slate-500">
              {q
                ? `"${q}"에 대한 검색 결과가 없습니다.`
                : "아직 등록된 후기가 없습니다."}
            </p>
            {!q ? (
              <Link
                href={
                  user
                    ? "/reviews/new"
                    : `/login?message=${encodeURIComponent("후기 작성은 로그인이 필요합니다.")}`
                }
                className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
              >
                {user ? "첫 후기를 남겨보세요 →" : "로그인하고 첫 후기를 남겨보세요 →"}
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
