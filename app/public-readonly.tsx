"use client";

import { usePathname } from "next/navigation";

export default function PublicReadonly({
  children,
  readonly,
}: {
  children: React.ReactNode;
  readonly: boolean;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const publicReadonly = readonly && !isLogin;

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 62px)" }}>
      <div style={{ pointerEvents: publicReadonly ? "none" : "auto" }}>{children}</div>

      {publicReadonly && (
        <div
          aria-label="외부 공개용 보기 전용 화면"
          style={{
            position: "fixed",
            top: 76,
            right: 24,
            zIndex: 900,
            pointerEvents: "none",
            padding: "9px 14px",
            borderRadius: 999,
            background: "rgba(22,35,59,.95)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.2,
            boxShadow: "0 6px 20px rgba(15,23,42,.16)",
            whiteSpace: "nowrap",
          }}
        >
          외부 공개 · 보기 전용
        </div>
      )}
    </div>
  );
}
