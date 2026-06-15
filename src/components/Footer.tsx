import Link from "next/link";

/**
 * 사이트 하단 푸터. 포트폴리오 데모용으로 서비스 소개·링크 섹션을 제공한다.
 * 실제 외부 페이지가 없는 항목은 홈(#) 기준으로 둔다.
 */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-base font-bold text-slate-900">강원 소상공인 후기</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              강원도 가게의 솔직한 후기를
              <br />
              남기고 나누는 공간
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">바로가기</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-slate-900">후기 목록</Link>
              </li>
              <li>
                <Link href="/reviews/new" className="hover:text-slate-900">후기 작성</Link>
              </li>
              <li>
                <Link href="/mypage" className="hover:text-slate-900">마이페이지</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">서비스</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><span className="cursor-default">이용약관</span></li>
              <li><span className="cursor-default">개인정보처리방침</span></li>
              <li><span className="cursor-default">문의하기</span></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">프로젝트</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Next.js 14 · Supabase</li>
              <li>포트폴리오 데모</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} 강원 소상공인 후기 게시판 · Portfolio Project
        </div>
      </div>
    </footer>
  );
}
