"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { SortOption, OrderOption } from "@/lib/types";

/**
 * 목록 상단 컨트롤: 검색창 + 정렬 기준(최신순/별점순) + 방향(오름차순/내림차순)
 * 모든 상태를 URL searchParams(?q=&sort=&order=)에 반영한다.
 */
export function ReviewListControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("q") ?? "";
  const currentSort = (searchParams.get("sort") as SortOption) ?? "latest";
  const currentOrder = (searchParams.get("order") as OrderOption) ?? "desc";

  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function buildUrl(next: { q?: string; sort?: string; order?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.sort !== undefined) params.set("sort", next.sort);
    if (next.order !== undefined) params.set("order", next.order);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: query.trim() }));
  }

  function toggleSort(sort: SortOption) {
    if (sort === currentSort) {
      // 같은 기준 재클릭 → 방향 반전
      router.push(buildUrl({ order: currentOrder === "desc" ? "asc" : "desc" }));
    } else {
      // 다른 기준 선택 → 해당 기준의 기본 방향(desc)으로 초기화
      router.push(buildUrl({ sort, order: "desc" }));
    }
  }

  const isDesc = currentOrder === "desc";

  // 방향 화살표 아이콘
  function ArrowIcon({ up }: { up: boolean }) {
    return (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        {up ? (
          <path d="M12 19V5M5 12l7-7 7 7" />
        ) : (
          <path d="M12 5v14M5 12l7 7 7-7" />
        )}
      </svg>
    );
  }

  const SORTS: { key: SortOption; label: string }[] = [
    { key: "latest", label: "최신순" },
    { key: "rating", label: "별점순" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* 검색창 */}
      <form onSubmit={onSearchSubmit} className="relative flex-1">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목·내용 검색"
          aria-label="후기 검색"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-200"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); router.push(buildUrl({ q: "" })); }}
            aria-label="검색어 지우기"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {/* 정렬 기준 + 방향 */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          role="tablist"
          aria-label="정렬 기준"
          className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm"
        >
          {SORTS.map(({ key, label }) => {
            const active = currentSort === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => toggleSort(key)}
                className={[
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                {label}
                {active && <ArrowIcon up={!isDesc} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
