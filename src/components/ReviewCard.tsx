import Link from "next/link";
import { StarRating } from "./StarRating";
import type { Review } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Link
      href={`/reviews/${review.id}`}
      className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:ring-slate-200"
    >
      <div className="mb-2 flex items-center gap-2">
        <StarRating rating={review.rating} size={16} />
        <span className="text-sm font-semibold text-amber-500">
          {review.rating}.0
        </span>
      </div>

      <h2 className="line-clamp-1 text-lg font-bold text-slate-900">
        {review.title}
      </h2>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
        {review.content}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-500">{review.nickname}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(review.created_at)}</span>
      </div>
    </Link>
  );
}
