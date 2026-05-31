"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState = { error?: string };

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

/** 폼 입력값을 검증해 정제된 값 또는 에러 메시지를 돌려준다. */
function parseReviewForm(formData: FormData):
  | { ok: true; title: string; content: string; rating: number }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);

  if (title.length === 0) return { ok: false, error: "제목을 입력해 주세요." };
  if (title.length > TITLE_MAX)
    return { ok: false, error: `제목은 ${TITLE_MAX}자 이하로 입력해 주세요.` };
  if (content.length === 0) return { ok: false, error: "내용을 입력해 주세요." };
  if (content.length > CONTENT_MAX)
    return { ok: false, error: `내용은 ${CONTENT_MAX}자 이하로 입력해 주세요.` };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { ok: false, error: "별점을 1~5 사이로 선택해 주세요." };

  return { ok: true, title, content, rating };
}

/** 가입 시 저장한 닉네임을 우선 사용하고, 없으면 이메일 앞부분으로 대체. */
function resolveNickname(user: {
  email?: string;
  user_metadata?: { nickname?: string };
}): string {
  const fromMeta = user.user_metadata?.nickname?.trim();
  if (fromMeta) return fromMeta.slice(0, 20);
  const fromEmail = user.email?.split("@")[0] ?? "익명";
  return fromEmail.slice(0, 20);
}

// 후기 작성
export async function createReview(
  formData: FormData
): Promise<ReviewFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?message=${encodeURIComponent("로그인이 필요합니다.")}`);

  const parsed = parseReviewForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      nickname: resolveNickname(user),
      title: parsed.title,
      content: parsed.content,
      rating: parsed.rating,
    })
    .select("id")
    .single();

  if (error) return { error: "저장 중 오류가 발생했습니다. 다시 시도해 주세요." };

  revalidatePath("/");
  redirect(`/reviews/${data.id}`);
}

// 후기 수정 (본인 글만 — RLS 가 DB 레벨에서 강제)
export async function updateReview(
  formData: FormData
): Promise<ReviewFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?message=${encodeURIComponent("로그인이 필요합니다.")}`);

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = parseReviewForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await supabase
    .from("reviews")
    .update({
      title: parsed.title,
      content: parsed.content,
      rating: parsed.rating,
    })
    .eq("id", id)
    .eq("user_id", user.id); // UI 가드 + RLS 와 함께 삼중 방어

  if (error) return { error: "수정 중 오류가 발생했습니다. 다시 시도해 주세요." };

  revalidatePath("/");
  revalidatePath(`/reviews/${id}`);
  redirect(`/reviews/${id}`);
}

// 후기 삭제 (본인 글만)
export async function deleteReview(formData: FormData): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?message=${encodeURIComponent("로그인이 필요합니다.")}`);

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/");

  await supabase.from("reviews").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/");
  redirect("/");
}
