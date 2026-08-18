"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/recruiting";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "로그인에 실패했습니다.");
      setLoading(false);
      return;
    }
    window.location.href = next.startsWith("/") ? next : "/recruiting";
  }

  return (
    <main style={{ minHeight: "calc(100vh - 65px)", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb" }}>
      <section style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 34, boxShadow: "0 18px 50px rgba(15,23,42,.08)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".12em", color: "#71819d" }}>K-BEAUTY RECRUITER</div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 30, color: "#16233b" }}>관리자 로그인</h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", lineHeight: 1.6 }}>채용·후보자·이력서·AI 매칭 기능은 관리자만 사용할 수 있습니다.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, fontWeight: 700, color: "#334155" }}>
            관리자 이메일
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required placeholder="관리자 이메일" style={{ padding: "12px 14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 15 }} />
          </label>
          <label style={{ display: "grid", gap: 7, fontWeight: 700, color: "#334155" }}>
            비밀번호
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required placeholder="비밀번호" style={{ padding: "12px 14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 15 }} />
          </label>
          {error && <div style={{ padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c", fontSize: 14 }}>{error}</div>}
          <button disabled={loading} type="submit" style={{ marginTop: 4, padding: "13px 16px", border: 0, borderRadius: 10, background: "#16233b", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
        <a href="/" style={{ display: "block", marginTop: 18, textAlign: "center", color: "#64748b", textDecoration: "none", fontSize: 14 }}>공개 산업 지형도로 돌아가기</a>
      </section>
    </main>
  );
}
