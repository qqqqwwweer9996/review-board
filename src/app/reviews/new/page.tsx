import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createReview } from "@/app/reviews/actions";
import { ReviewForm } from "@/components/ReviewForm";

export default async function NewReviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인 사용자는 로그인 페이지로 (작성은 로그인 필요)
  if (!user) {
    redirect(`/login?message=${encodeURIComponent("후기 작성은 로그인이 필요합니다.")}`);
  }

  return (
    <div className="px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            후기 작성
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            강원도 소상공인 가게를 이용한 경험을 들려주세요.
          </p>
        </header>
        <ReviewForm action={createReview} submitLabel="등록하기" />
      </div>
    </div>
  );
}
