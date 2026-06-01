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
  // 사용자 입력은 %로 감싸 LIKE 패턴으로 만든다.
  if (q) {
    const pattern = `%${q}%`;
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  // 정렬(요구사항 #3): 별점순 / 최신순 + 오름/내림 방향.
  // 별점순일 때 동점은 최신 글이 위로 오도록 created_at desc 를 보조키로 둔다.
  if (sort === "rating") {
    query = query
      .order("rating", { ascending: asc })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: asc });
  }

  const { data: reviews } = await query.returns<Review[]>();
  const list = reviews ?? [];

  const sortLabel =
    sort === "rating"
      ? `별점 ${asc ? "낮은" : "높은"}순`
      : `${asc ? "오래된" : "최신"}순`;

  return (
    <div className="px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            강원도 소상공인 후기
          </h1>
          {list.length > 0 ? (
            <p className="mt-0.5 text-xs text-slate-400">
              {q ? `"${q}" 검색 결과 ` : ""}
              {list.length}건 · {sortLabel}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">
              강원도 가게 후기를 남기고 별점도 확인해 보세요.
            </p>
          )}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
