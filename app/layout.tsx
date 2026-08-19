import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";
import PublicReadonly from "./public-readonly";
import "./globals.css";

export const metadata: Metadata = { title: "2026 K-뷰티 화장품 산업 지형도", description: "한국 화장품 산업 지형도 대시보드" };

const menu = [
  { label: "산업 지형도", href: "/" },
  { label: "기업 데이터", href: "/company-data", private: true },
  { label: "채용 분석", href: "/recruiting", private: true },
  { label: "후보자 관리", href: "/candidates", private: true },
  { label: "이력서 업로드", href: "/resume-upload", private: true },
  { label: "AI 매칭", href: "/ai-match", private: true },
  { label: "데이터 품질", href: "/data-quality", private: true },
  { label: "이력서 기업 매칭", href: "/resume-match", private: true },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const loggedIn = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  return (
    <html lang="ko">
      <body>
        <div className="app-shell dashboard-v2">
          <header className="global-header">
            <Link href="/" className="global-brand">K-뷰티 <span>산업 지형도</span><b>2026</b></Link>
            <nav className="global-nav" aria-label="관리자 메뉴">
              {menu.filter(item => loggedIn || !item.private).map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </nav>
            <div className="global-account">
              {loggedIn ? <a href="/api/logout">관리자 로그아웃</a> : <Link href="/login">관리자 로그인</Link>}
            </div>
          </header>
          <PublicReadonly readonly={!loggedIn}>{children}</PublicReadonly>
        </div>
      </body>
    </html>
  );
}
