import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트.
 *
 * - "use client" 컴포넌트(예: 이미지 업로드, 회원가입 폼)에서 호출한다.
 * - 사용하는 anon key 는 NEXT_PUBLIC_ 접두사가 붙어 브라우저에 노출되지만,
 *   이는 의도된 공개 키다. 실제 데이터 보호는 DB 의 RLS 정책이 담당한다.
 *   (anon key 만으로는 RLS 를 우회할 수 없음)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
