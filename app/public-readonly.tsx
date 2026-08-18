"use client";

export default function PublicReadonly({ children, readonly: _readonly }: { children: React.ReactNode; readonly: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <div
        aria-label="외부 공개용 보기 전용 화면"
        aria-hidden="true"
        style={{ position: "fixed", top: 16, right: 24, zIndex: 1100, pointerEvents: "none", padding: "8px 12px", borderRadius: 999, background: "rgba(22,35,59,.92)", color: "#fff", fontSize: 12, fontWeight: 800, boxShadow: "0 6px 20px rgba(15,23,42,.15)" }}
      >
        외부 공개 · 인터랙티브 보기
      </div>
    </div>
  );
}
