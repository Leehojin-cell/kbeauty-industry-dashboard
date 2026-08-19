import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";
import PublicReadonly from "./public-readonly";
import "./globals.css";

export const metadata: Metadata = { title: "2026 K-뷰티 산업 지형도", description: "한국 화장품 산업 지형도 대시보드" };

const menu = [
  { label: "산업 지형도", icon: "▥", href: "/" },
  { label: "기업 데이터", icon: "▦", href: "/company-data" },
  { label: "채용 분석", icon: "ⓘ", href: "/recruiting", private: true },
  { label: "후보자 관리", icon: "◎", href: "/candidates", private: true },
  { label: "이력서 업로드", icon: "▤", href: "/resume-upload", private: true },
  { label: "AI 매칭", icon: "✦", href: "/ai-match", private: true },
  { label: "데이터 품질", icon: "✓", href: "/data-quality", private: true },
  { label: "이력서 기업 매칭", icon: "↔", href: "/resume-match", private: true },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const loggedIn = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand"><span>K-뷰티 산업 지형도</span><b>2025</b></Link>
            <nav className="side-nav" aria-label="주요 메뉴">
              {menu.filter(item => loggedIn || !item.private).map(item => (
                <Link key={item.href} href={item.href} className={`side-link ${item.href === "/" ? "active" : ""}`}>
                  <span className="side-icon">{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="side-note">본 사이트는<br/>K-뷰티 산업 정보를<br/>제공하기 위한<br/>공개 대시보드입니다.</div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="topbar-spacer" />
              {!loggedIn && <span className="public-pill">외부 공개 · 보기 전용</span>}
              <span className="help-pill">?</span>
              {loggedIn ? <a className="login-pill" href="/api/logout">관리자 로그아웃</a> : <Link className="login-pill" href="/login">♟ 관리자 로그인</Link>}
            </header>
            <PublicReadonly readonly={!loggedIn}>{children}</PublicReadonly>
          </div>
        </div>
      </body>
    </html>
  );
}
