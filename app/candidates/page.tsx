"use client";

import { useEffect, useMemo, useState } from "react";
import { Candidate, companies, seedCandidates } from "../../lib/recruiting-data";

const STORAGE_KEY = "kbeauty_candidates_v1";

function score(candidate: Candidate, companyName: string) {
  const company = companies.find((item) => item.name === companyName) ?? companies[0];
  const roleHit = company.roles.some((role) => candidate.role.includes(role) || candidate.skills.some((skill) => skill.includes(role) || role.includes(skill)));
  const marketHit = company.markets.some((market) => candidate.markets.includes(market));
  const targetHit = candidate.target.includes(company.name);
  const industryHit = candidate.company.includes("뷰티") || candidate.company.includes("화장품") || candidate.skills.some((s) => /ODM|OEM|화장품|뷰티/i.test(s));
  return Math.min(99, 35 + (roleHit ? 30 : 0) + (marketHit ? 15 : 0) + (targetHit ? 10 : 0) + (industryHit ? 9 : 0));
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState(companies[0].name);
  const [name, setName] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("");
  const [skills, setSkills] = useState("");
  const [markets, setMarkets] = useState("");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCandidates(JSON.parse(saved));
    } catch {}
  }, []);

  function persist(next: Candidate[]) {
    setCandidates(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addCandidate() {
    if (!name.trim()) {
      setMessage("후보자명을 입력하세요.");
      return;
    }
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      company: currentCompany.trim() || "미입력",
      role: role.trim() || "미입력",
      years: Number(years) || 0,
      skills: skills.split(",").map((v) => v.trim()).filter(Boolean),
      markets: markets.split(",").map((v) => v.trim()).filter(Boolean),
      target: target.trim(),
      note: "사용자 등록 후보자",
    };
    persist([candidate, ...candidates]);
    setName(""); setCurrentCompany(""); setRole(""); setYears(""); setSkills(""); setMarkets(""); setTarget("");
    setMessage(`${candidate.name} 후보자를 저장했습니다.`);
  }

  function removeCandidate(id: string) {
    persist(candidates.filter((candidate) => candidate.id !== id));
    setMessage("후보자를 삭제했습니다.");
  }

  function importLatestResume() {
    try {
      const raw = localStorage.getItem("kbeauty_resume_profile");
      if (!raw) { setMessage("먼저 이력서 업로드에서 AI 분석을 실행하세요."); return; }
      const data = JSON.parse(raw);
      const summary = data.ai?.candidate_summary || "최근 업로드 이력서 분석 결과";
      const candidate: Candidate = {
        id: crypto.randomUUID(),
        name: data.ai?.candidate_name || "이력서 후보자",
        company: "이력서 분석",
        role: data.ai?.recommended_role || "확인 필요",
        years: 0,
        skills: data.ai?.top_recommendations?.[0]?.strengths?.slice(0, 5) || [],
        markets: data.ai?.recommended_market ? [data.ai.recommended_market] : [],
        target: data.ai?.top_recommendations?.slice(0, 3).map((x: { company: string }) => x.company).join("·") || "",
        note: summary,
        resumeText: data.resumeText,
      };
      persist([candidate, ...candidates]);
      setMessage("최근 이력서 분석 결과를 후보자 DB에 등록했습니다.");
    } catch {
      setMessage("이력서 분석 결과를 불러오지 못했습니다.");
    }
  }

  const filtered = useMemo(() => candidates.filter((candidate) => {
    const text = `${candidate.name} ${candidate.company} ${candidate.role} ${candidate.skills.join(" ")} ${candidate.markets.join(" ")} ${candidate.target}`.toLowerCase();
    return !query || text.includes(query.toLowerCase());
  }), [candidates, query]);

  return (
    <main className="page">
      <header className="hero"><div><div className="eyebrow">2026 K-BEAUTY · V15</div><h1>후보자 DB & 기업 매칭</h1><p>후보자를 저장하고 기업별 채용수요와 1차 적합도를 확인합니다.</p></div></header>
      <section className="notice">관리자 로그인 상태에서만 사용할 수 있습니다. 연락처·주민번호·주소 등 불필요한 민감정보는 저장하지 마세요.</section>

      <section className="panel">
        <div className="toolbar"><div><h2>후보자 DB</h2><p className="sub">브라우저에 저장되어 새로고침 후에도 유지됩니다.</p></div><input placeholder="후보자·직무·역량 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="addbox">
          <input placeholder="후보자명 *" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="현재 회사" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} />
          <input placeholder="현재 직무" value={role} onChange={(e) => setRole(e.target.value)} />
          <input type="number" placeholder="경력(년)" value={years} onChange={(e) => setYears(e.target.value)} />
          <input placeholder="핵심역량(쉼표 구분)" value={skills} onChange={(e) => setSkills(e.target.value)} />
          <input placeholder="시장 경험(쉼표 구분)" value={markets} onChange={(e) => setMarkets(e.target.value)} />
          <input placeholder="목표 기업(쉼표 또는 ·)" value={target} onChange={(e) => setTarget(e.target.value)} />
          <button className="btn dark" onClick={addCandidate}>후보자 추가</button>
          <button className="btn" onClick={importLatestResume}>최근 이력서에서 등록</button>
        </div>
        {message && <p className="sub" style={{ marginTop: 12 }}>{message}</p>}
        <div className="candidategrid">
          {filtered.map((candidate) => <article className="candidate" key={candidate.id}>
            <div className="tag">{candidate.role}</div><h3>{candidate.name}</h3><p>{candidate.company} · 경력 {candidate.years}년</p>
            <div className="chips">{candidate.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            <p className="muted">시장: {candidate.markets.join(" · ") || "미입력"}</p>
            <b>추천 포인트</b><p>{candidate.note}</p>
            <button className="btn" onClick={() => removeCandidate(candidate.id)}>삭제</button>
          </article>)}
        </div>
      </section>

      <section className="panel">
        <div className="toolbar"><div><h2>기업 ↔ 후보자 매칭</h2><p className="sub">직무·시장·산업 경험을 기준으로 한 1차 스크리닝입니다.</p></div><select value={company} onChange={(e) => setCompany(e.target.value)}>{companies.map((item) => <option key={item.name}>{item.name}</option>)}</select></div>
        <div className="matchhead"><b>{company}</b><span>필요직무: {companies.find((item) => item.name === company)?.roles.join(" · ")}</span><span>시장: {companies.find((item) => item.name === company)?.markets.join(" · ")}</span></div>
        <div className="matchlist">{filtered.map((candidate) => { const s = score(candidate, company); return <div className="matchrow" key={candidate.id}><div><b>{candidate.name}</b><span>{candidate.role} · {candidate.years}년</span></div><div className="meter"><i style={{ width: `${s}%` }} /></div><strong>{s}%</strong><small>{s >= 80 ? "강력 추천" : s >= 65 ? "검토 추천" : "낮은 적합도"}</small></div>; })}</div>
      </section>
      <footer>V15 · 후보자 DB · 저장 · 검색 · 기업↔후보자 매칭</footer>
    </main>
  );
}
