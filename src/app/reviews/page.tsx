import { redirect } from "next/navigation";

// 후기 목록은 홈(/)으로 통합되었다. 기존 링크/북마크 호환을 위해 리다이렉트.
export default function ReviewsIndexRedirect({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; order?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.order) params.set("order", searchParams.order);
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
