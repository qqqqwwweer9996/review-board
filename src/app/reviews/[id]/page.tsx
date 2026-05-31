import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/StarRating";
import { deleteReview } from "@/app/reviews/actions";
import type { Review } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Review>();

  if (!review) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === review.user_id;
  const edited = review.created_at !== review.updated_at;

  return (
    <div className="px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        ← 목록으로
      </Link>

      <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={review.rating} size={20} />
          <span className="text-sm font-semibold text-amber-500">
            {review.rating}.0
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {review.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{review.nickname}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(review.created_at)}</span>
          {edited ? <span className="text-slate-400">(수정됨)</span> : null}
        </div>

        <hr className="my-6 border-slate-100" />

        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
          {review.content}
        </p>

        {isOwner ? (
          <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-6">
            <Link
              href={`/reviews/${review.id}/edit`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              수정
            </Link>
            <form action={deleteReview}>
              <input type="hidden" name="id" value={review.id} />
              <button
                type="submit"
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                삭제
              </button>
            </form>
          </div>
        ) : null}
      </article>
    </div>
  );
}
