import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";
import PublicReadonly from "./public-readonly";
import "./globals.css";

export const metadata: Metadata = { title: "2026 K-뷰티 산업 지형도", description: "한국 화장품 산업 지형도 대시보드" };

const menu = [
  { label: "산업 지형도", href: "/" },
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
        <nav
          aria-label="주요 메뉴"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "12px 24px",
            background: "rgba(255,255,255,.98)",
            borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 2px 12px rgba(15,23,42,.06)",
            backdropFilter: "blur(10px)",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 900,
              fontSize: 15,
              marginRight: 10,
              color: "#16233b",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            K-BEAUTY
          </Link>
          {menu
            .filter((item) => loggedIn || !item.private)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "9px 12px",
                  borderRadius: 9,
                  textDecoration: "none",
                  color: "#26344d",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "1px solid transparent",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </Link>
            ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {loggedIn ? (
              <a
                href="/api/logout"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "9px 14px",
                  borderRadius: 9,
                  textDecoration: "none",
                  color: "#fff",
                  background: "#16233b",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                로그아웃
              </a>
            ) : (
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "9px 14px",
                  borderRadius: 9,
                  textDecoration: "none",
                  color: "#fff",
                  background: "#16233b",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                관리자 로그인
              </Link>
            )}
          </div>
        </nav>
        <PublicReadonly readonly={!loggedIn}>{children}</PublicReadonly>
      </body>
    </html>
  );
}
