import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "강원도 소상공인 후기 게시판",
  description: "강원도 소상공인 가게 이용 후기를 남기고 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        <Header />
        {/* 페이지별로 폭을 직접 제어한다(히어로/푸터는 풀폭, 콘텐츠는 가운데 정렬). */}
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
