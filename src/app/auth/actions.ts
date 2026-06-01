"use server";
// 인증 관련 Server Action 모음.
// 회원가입은 클라이언트 폼(SignupForm)에서 supabase.auth.signUp 으로 직접 처리하고,
// 로그인/로그아웃은 폼 → 이 서버 액션으로 처리한다.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 이메일/비밀번호 로그인.
 * 실패 시 에러 메시지를 쿼리스트링에 담아 로그인 페이지로 되돌린다.
 * (구체적 사유를 노출하지 않아 계정 존재 여부 추측을 막는다)
 */
export async function login(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("이메일 또는 비밀번호가 올바르지 않습니다.")}`);
  }

  // 로그인 상태가 바뀌었으니 레이아웃(헤더 포함) 캐시를 무효화한다.
  revalidatePath("/", "layout");
  redirect("/");
}

/** 로그아웃: 세션 종료 후 홈으로. */
export async function signout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
