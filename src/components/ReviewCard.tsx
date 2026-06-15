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

/** 닉네임 첫 글자로 만드는 아바타 색상 (이름별로 일관되게) */
const AVATAR_COLORS = [
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600",
];
function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Link
      href={`/reviews/${review.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-slate-200"
    >
      {/* 썸네일: 이미지가 있으면 표시, 없으면 그라데이션 플레이스홀더 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {review.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg
              width={40}
              height={40}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              className="text-slate-300"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
            </svg>
          </div>
        )}
        {/* 평점 배지 (좌상단) */}
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" className="text-amber-400" aria-hidden="true">
            <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.98l-5.88 3.09 1.12-6.55L2.48 9.88l6.58-.96L12 2.5z" />
          </svg>
          {review.rating.toFixed(1)}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <StarRating rating={review.rating} size={15} />
        </div>

        <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-indigo-600">
          {review.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
          {review.content}
        </p>

        {/* 작성자 + 날짜 */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(
              review.nickname
            )}`}
            aria-hidden="true"
          >
            {review.nickname.slice(0, 1)}
          </span>
          <span className="truncate text-xs font-medium text-slate-600">
            {review.nickname}
          </span>
          <span className="ml-auto shrink-0 text-xs text-slate-400">
            {formatDate(review.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
