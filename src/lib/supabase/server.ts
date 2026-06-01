import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 측(서버 컴포넌트 / Server Action / Route Handler)에서 사용하는
 * Supabase 클라이언트.
 *
 * 쿠키 기반으로 로그인 세션을 읽고 쓴다. getAll/setAll 어댑터를 통해
 * Next.js 의 쿠키 저장소와 Supabase 의 세션을 연결한다.
 *
 * 요청마다 새로 생성해야 한다(전역 캐시 금지). 그래야 사용자별 세션이
 * 섞이지 않는다.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트(렌더링 단계)에서는 쿠키 set 이 허용되지 않아
            // 에러가 난다. 토큰 갱신은 미들웨어(updateSession)가 담당하므로
            // 여기서 발생하는 예외는 무시해도 안전하다.
          }
        },
      },
    }
  );
}
