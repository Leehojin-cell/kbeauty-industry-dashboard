"use client";

import { useEffect, useMemo, useState } from "react";
import { Candidate, companies, seedCandidates } from "../../lib/recruiting-data";

type AIItem = { company: string; score: number; verdict: string; why: string[]; strengths: string[]; gaps: string[]; role: string; market: string; recruiter_note: string };
type AIResult = { candidate_summary: string; recommended_role: string; recommended_market: string; top_recommendations: AIItem[]; resume_improvements: string[]; model?: string };
const CANDIDATE_KEY = "kbeauty_candidates_v1";
const RESUME_KEY = "kbeauty_resume_profile";

export default function AiMatch() {
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [companyName, setCompanyName] = useState("전체 기업");
  const [result, setResult] = useState<AIResult | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedCandidates = localStorage.getItem(CANDIDATE_KEY);
      const list: Candidate[] = savedCandidates ? JSON.parse(savedCandidates) : seedCandidates;
      setCandidates(list);
      if (list[0]) setSelectedCandidate(list[0].id);
      const savedResume = localStorage.getItem(RESUME_KEY);
      if (savedResume) {
        const data = JSON.parse(savedResume);
        setResumeText(data.resumeText || "");
        if (data.ai) setResult(data.ai);
      }
    } catch {}
  }, []);

  const selected = useMemo(() => candidates.find((candidate) => candidate.id === selectedCandidate) ?? candidates[0], [candidates, selectedCandidate]);
  const selectedCompany = companies.find((company) => company.name === companyName);

  function candidateText() {
    if (!selected) return resumeText;
    return selected.resumeText || `${selected.name}\n현재 회사: ${selected.company}\n현재 직무: ${selected.role}\n경력: ${selected.years}년\n핵심역량: ${selected.skills.join(", ")}\n시장 경험: ${selected.markets.join(", ")}\n목표 기업: ${selected.target}\n추천 포인트: ${selected.note}`;
  }

  async function runMatch() {
    const resume = candidateText().trim();
    if (!resume) { setMessage("후보자 정보 또는 이력서가 없습니다. 먼저 이력서 업로드를 실행하세요."); return; }
    setBusy(true); setMessage("");
    try {
      const targetCompanies = selectedCompany ? [selectedCompany] : companies;
      const response = await fetch("/api/ai-match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume, companies: targetCompanies }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 매칭에 실패했습니다.");
      setResult(data);
      if (!selectedCompany) localStorage.setItem(RESUME_KEY, JSON.stringify({ fileName: "AI 매칭", resumeText: resume, ai: data, savedAt: new Date().toISOString() }));
      setMessage("AI 매칭이 완료되었습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "AI 매칭 중 오류가 발생했습니다."); }
    finally { setBusy(false); }
  }

  async function copy(text: string) { await navigator.clipboard?.writeText(text); setMessage("복사했습니다."); }

  return <main className="page">
    <header className="hero"><div><div className="eyebrow">2026 K-BEAUTY · V15 AI MATCH</div><h1>AI 후보자 ↔ 기업 매칭</h1><p>후보자의 실제 이력서와 기업 채용수요를 AI로 비교해 추천도·근거·보완점·고객사 추천문안을 만듭니다.</p></div></header>
    <section className="notice"><b>관리자 전용 기능입니다.</b> 이력서 업로드에서 저장한 후보자와 후보자 DB를 바로 불러와 실제 OpenAI API 분석을 실행할 수 있습니다.</section>
    <section className="panel">
      <div className="addbox">
        <div><label>후보자</label><select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.role}</option>)}</select></div>
        <div><label>기업</label><select value={companyName} onChange={(e) => setCompanyName(e.target.value)}><option value="전체 기업">전체 기업</option>{companies.map((company) => <option key={company.name}>{company.name}</option>)}</select></div>
      </div>
      <div className="cards"><div className="card"><span>후보자</span><b>{selected?.name || "없음"}</b></div><div className="card"><span>경력</span><b>{selected?.years || 0}년</b></div><div className="card"><span>대상</span><b>{selectedCompany?.name || `${companies.length}개 기업`}</b></div><div className="card"><span>AI 상태</span><b>{busy ? "분석 중" : "대기"}</b></div></div>
      <button className="btn dark" onClick={runMatch} disabled={busy}>{busy ? "AI 매칭 중..." : "AI 정밀 매칭 실행"}</button>{message && <p className="sub" style={{ marginTop: 12 }}>{message}</p>}
    </section>

    {result && <>
      <section className="panel"><div className="toolbar"><div><h2>AI 포지셔닝</h2><p className="sub">모델: {result.model || "OpenAI"}</p></div><button className="btn" onClick={() => copy(result.candidate_summary)}>요약 복사</button></div><div className="cards"><div className="card"><span>추천 직무</span><b>{result.recommended_role}</b></div><div className="card"><span>추천 시장</span><b>{result.recommended_market}</b></div><div className="card"><span>분석 기업</span><b>{result.top_recommendations?.length || 0}개</b></div><div className="card"><span>이력서</span><b>{resumeText ? "업로드됨" : "DB 정보"}</b></div></div><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{result.candidate_summary}</p></section>
      <section className="panel"><h2>기업별 AI 추천</h2><div className="candidategrid">{(result.top_recommendations || []).map((item) => <article className="candidate" key={item.company}><div className="tag">{item.verdict}</div><h3>{item.company} · {item.score}%</h3><p><b>추천 직무</b> · {item.role}</p><p><b>추천 시장</b> · {item.market}</p><b>핵심 근거</b>{item.why?.map((line) => <p key={line}>· {line}</p>)}<p><b>강점</b> · {item.strengths?.join(" · ")}</p><p className="muted"><b>보완·확인</b> · {item.gaps?.join(" · ") || "추가 확인사항 없음"}</p><button className="btn" onClick={() => copy(item.recruiter_note)}>고객사 추천문안 복사</button></article>)}</div></section>
      <section className="panel"><h2>이력서 보완사항</h2><div className="ranklist">{(result.resume_improvements || []).map((item, index) => <div className="rankrow" key={item}><b>{index + 1}</b><span>{item}</span></div>)}</div></section>
    </>}
    <footer>V15 · 후보자 선택 · 기업 선택 · OpenAI AI 매칭 · 추천문안 복사 · 결과 저장</footer>
  </main>;
}
