interface StarRatingProps {
  rating: number; // 0~5
  /** 별 크기(px). 기본 16 */
  size?: number;
  className?: string;
}

/**
 * 읽기 전용 별점 표시. 채워진 별 + 빈 별을 겹쳐 부분 점수는 표현하지 않고
 * 정수 별점(1~5)을 보여준다.
 */
export function StarRating({ rating, size = 16, className }: StarRatingProps) {
  const rounded = Math.round(rating);
  return (
    <span
      className={["inline-flex items-center", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`별점 ${rounded}점 (5점 만점)`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={n <= rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={n <= rounded ? 0 : 1.5}
          className={n <= rounded ? "text-amber-400" : "text-slate-300"}
          aria-hidden="true"
        >
          <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.98l-5.88 3.09 1.12-6.55L2.48 9.88l6.58-.96L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
