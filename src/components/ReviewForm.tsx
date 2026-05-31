"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { StarRatingInput } from "./StarRatingInput";
import type { ReviewFormState } from "@/app/reviews/actions";

type Action = (formData: FormData) => Promise<ReviewFormState>;

interface ReviewFormProps {
  action: Action;
  /** 수정 모드일 때 채워질 기본값 */
  defaultValues?: {
    id?: string;
    title?: string;
    content?: string;
    rating?: number;
  };
  submitLabel?: string;
}

export function ReviewForm({
  action,
  defaultValues,
  submitLabel = "등록하기",
}: ReviewFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // 핵심: react-dom 폼 훅(useFormState/useFormStatus) 대신 코어 훅만 사용한다.
  // preventDefault 로 폼 리셋을 막아 검증 에러 시 입력값이 보존된다.
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await action(formData);
      // 성공 시 서버 액션이 redirect() 하므로 여기로 돌아오지 않는다.
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch {
      setError("처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          제목 <span className="text-indigo-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={defaultValues?.title}
          placeholder="예: 속초 OO식당 - 친절하고 맛있어요"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-200"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          별점 <span className="text-indigo-600">*</span>
        </span>
        <StarRatingInput name="rating" defaultValue={defaultValues?.rating ?? 0} />
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          내용 <span className="text-indigo-600">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          maxLength={2000}
          rows={8}
          defaultValue={defaultValues?.content}
          placeholder="가게 위치, 메뉴, 가격, 분위기 등 다른 분들에게 도움이 될 후기를 남겨주세요."
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-200"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center justify-center rounded-xl border border-slate-300 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              저장 중...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
