"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadFieldProps {
  name: string;
  /** 수정 모드에서 기존 이미지 URL */
  defaultUrl?: string | null;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * 이미지 1장을 Supabase Storage(review-images 버킷)에 업로드하고,
 * 결과 public URL 을 hidden input(name)으로 폼에 전달한다.
 * 경로는 <uid>/<timestamp>-<rand>.<ext> 로, Storage RLS(본인 폴더)와 맞춘다.
 */
export function ImageUploadField({ name, defaultUrl = null }: ImageUploadFieldProps) {
  const [url, setUrl] = useState<string | null>(defaultUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelect(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("JPG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("이미지 용량은 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("로그인이 필요합니다.");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("review-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (upErr) {
        setError("업로드에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("review-images").getPublicUrl(path);

      setUrl(publicUrl);
    } catch {
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* 업로드된 URL 을 폼에 전달 */}
      <input type="hidden" name={name} value={url ?? ""} />

      {url ? (
        <div className="relative inline-block">
          {/* 미리보기: Storage 외부 도메인이라 next/image 대신 img 사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="첨부 이미지 미리보기"
            className="max-h-64 w-auto rounded-xl border border-slate-200 object-cover"
          />
          <button
            type="button"
            onClick={clear}
            aria-label="이미지 제거"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40",
            uploading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSelect(f);
            }}
          />
          {uploading ? (
            <>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" aria-hidden="true" />
              <span className="text-sm text-slate-500">업로드 중...</span>
            </>
          ) : (
            <>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 20" />
              </svg>
              <span className="text-sm font-medium text-slate-600">
                사진 추가 (선택)
              </span>
              <span className="text-xs text-slate-400">JPG·PNG·WebP·GIF / 최대 5MB</span>
            </>
          )}
        </label>
      )}

      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
