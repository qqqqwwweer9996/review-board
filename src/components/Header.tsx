import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/auth/actions";

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          강원 소상공인 후기
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              <Link
                href="/mypage"
                className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                마이페이지
              </Link>
              <form action={signout}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
