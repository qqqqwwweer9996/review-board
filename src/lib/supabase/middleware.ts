import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 매 요청마다 세션 쿠키를 갱신해 로그인 상태를 유지한다.
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수가 없으면(예: 배포 환경에 미등록) 미들웨어가 크래시해서
  // 사이트 전체가 500 나는 것을 막고, 세션 갱신만 건너뛴다.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  let response = supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    // getUser() 호출이 만료된 토큰을 갱신한다.
    await supabase.auth.getUser();
  } catch {
    // 네트워크/인증 오류로 미들웨어가 죽지 않도록 방어한다.
  }

  return response;
}
