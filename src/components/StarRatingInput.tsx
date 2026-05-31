"use client";

import { useState } from "react";

interface StarRatingInputProps {
  name: string;
  defaultValue?: number; // 1~5, 0 이면 미선택
}

const LABELS = ["", "별로예요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"];

/**
 * 클릭/호버로 1~5 별점을 고르는 입력 컴포넌트.
 * 선택값은 hidden input(name) 으로 폼에 전달되어 Server Action 에서 읽힌다.
 * 라디오 그룹처럼 키보드(좌우 화살표)로도 조정 가능하다.
 */
export function StarRatingInput({ name, defaultValue = 0 }: StarRatingInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);

  const display = hover || value;

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="별점 선택"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onClick={() => setValue(n)}
            onMouseEnter={() => setHover(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                setValue((v) => Math.min(5, v + 1));
              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                setValue((v) => Math.max(1, v - 1));
              }
            }}
            className="rounded p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill={n <= display ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={n <= display ? 0 : 1.5}
              className={n <= display ? "text-amber-400" : "text-slate-300"}
              aria-hidden="true"
            >
              <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.98l-5.88 3.09 1.12-6.55L2.48 9.88l6.58-.96L12 2.5z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-slate-500">
          {display > 0 ? `${display}점 · ${LABELS[display]}` : "별점을 선택하세요"}
        </span>
      </div>
    </div>
  );
}
