import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateReview } from "@/app/reviews/actions";
import { ReviewForm } from "@/components/ReviewForm";
import type { Review } from "@/lib/types";

export default async function EditReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인이 필요합니다.")}`);
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Review>();

  if (!review) notFound();

  // 본인 글이 아니면 상세로 돌려보낸다 (UI 가드 — DB 는 RLS 로 막힘)
  if (review.user_id !== user.id) redirect(`/reviews/${review.id}`);

  return (
    <div className="px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            후기 수정
          </h1>
        </header>
        <ReviewForm
          action={updateReview}
          submitLabel="수정 완료"
          defaultValues={{
            id: review.id,
            title: review.title,
            content: review.content,
            rating: review.rating,
          }}
        />
      </div>
    </div>
  );
}
