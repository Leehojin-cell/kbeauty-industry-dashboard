"use client";

import { usePathname } from "next/navigation";

export default function PublicReadonly({ children, readonly }: { children: React.ReactNode; readonly: boolean }) {
  const pathname = usePathname();
  if (pathname !== "/" || !readonly) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ pointerEvents: "none" }}>{children}</div>
      <div
        aria-label="외부 공개용 보기 전용 화면"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 20, cursor: "not-allowed", background: "transparent" }}
      >
        <div style={{ position: "sticky", top: 16, marginLeft: "auto", marginRight: 24, width: "fit-content", padding: "8px 12px", borderRadius: 999, background: "rgba(22,35,59,.92)", color: "#fff", fontSize: 12, fontWeight: 800, boxShadow: "0 6px 20px rgba(15,23,42,.15)" }}>
          외부 공개 · 보기 전용
        </div>
      </div>
    </div>
  );
}
