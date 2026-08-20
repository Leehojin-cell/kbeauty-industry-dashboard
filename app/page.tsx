import { cookies } from "next/headers";
import InteractiveDashboard from "./dashboard/InteractiveDashboard";
import MediaManagerBulk from "./dashboard/MediaManagerBulk";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";

const navItems = [
  ["대시보드", "/"],
  ["기업 분석", "/company-data"],
  ["재무 분석", "/data-quality"],
  ["산업 동향", "/recruiting"],
  ["AI 인사이트", "/ai-match"],
  ["보고서", "/company-data"],
] as const;

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAdmin = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);

  return (
    <div className="landing-frame">
      <aside className="landing-sidebar" aria-label="주요 메뉴">
        <div className="landing-brand">
          <div className="landing-brand-mark">K</div>
          <div>
            <strong>K-뷰티 산업 지형도</strong>
            <span>2026 Industry Dashboard</span>
          </div>
        </div>
        <nav className="landing-nav">
          {navItems.map(([label, href], index) => (
            <a key={`${label}-${index}`} href={href} className={index === 0 ? "active" : ""}>
              <span className="nav-dot" />{label}
            </a>
          ))}
        </nav>
        <div className="landing-sidebar-divider" />
        <nav className="landing-nav landing-nav-secondary">
          <a href="#recruiting"><span className="nav-dot" />공고 확인</a>
          <a href="#youtube"><span className="nav-dot" />YouTube 링크</a>
          <a href="#imagepdf"><span className="nav-dot" />이미지 &amp; PDF 저장</a>
        </nav>
        <div className="landing-user">
          <strong>{isAdmin ? "관리자" : "외부 공개"}</strong>
          <span>{isAdmin ? "관리자 모드" : "보기 전용"}</span>
        </div>
      </aside>

      <div className="landing-main dashboard-shell">
        <div className="landing-main-inner">
          <InteractiveDashboard isAdmin={isAdmin} />
          <div className="media-page-wrap" id="media-management">
            <MediaManagerBulk isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
