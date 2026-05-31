import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 마이페이지는 로그인 필요
  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인이 필요합니다.")}`);
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Review[]>();

  const list = reviews ?? [];
  const nickname = (user.user_metadata?.nickname as string | undefined) ?? null;
  const avgRating =
    list.length > 0
      ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1)
      : null;

  return (
    <div className="px-4 py-8">
      {/* 프로필 헤더 */}
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">마이페이지</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          {nickname ? (
            <span className="font-medium text-slate-700">{nickname}</span>
          ) : null}
          <span className="truncate">{user.email}</span>
        </div>

        <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm">
          <div>
            <span className="text-slate-400">작성한 후기</span>{" "}
            <span className="font-bold text-slate-900">{list.length}건</span>
          </div>
          {avgRating ? (
            <div>
              <span className="text-slate-400">평균 별점</span>{" "}
              <span className="font-bold text-amber-500">★ {avgRating}</span>
            </div>
          ) : null}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-900">내가 작성한 후기</h2>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center">
          <p className="text-slate-500">아직 작성한 후기가 없습니다.</p>
          <Link
            href="/reviews/new"
            className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            첫 후기를 남겨보세요 →
          </Link>
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
