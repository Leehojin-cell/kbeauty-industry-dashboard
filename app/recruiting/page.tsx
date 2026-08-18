"use client";

import { useMemo, useState } from "react";

type Job = {
  company: string;
  category: string;
  status: string;
  roles: string[];
  evidence: string;
  source: string;
  priority: string;
};

const jobs: Job[] = [
  {
    company: "에이피알",
    category: "성장 인디 브랜드",
    status: "진행중",
    roles: ["해외 B2B 영업", "북미/유럽 해외영업", "생산", "기획·전략", "IT·데이터"],
    evidence: "2026년 진행중 공고 18건. 해외 B2B 영업에서 중남미/MENA/아시아 및 북미/유럽 권역 채용 확인.",
    source: "사람인 채용정보",
    priority: "매우 높음",
  },
  {
    company: "달바글로벌",
    category: "성장 인디 브랜드",
    status: "진행중",
    roles: ["북미 B2B 해외영업", "북미 브랜드마케팅", "북미·유럽 이커머스 MD", "글로벌 그로스 마케팅", "일본 온라인 MD·마케팅", "상품기획"],
    evidence: "현재 진행중 공고가 다수 확인되며 영업·판매·무역, 마케팅, 상품기획·MD가 주요 채용 축. 공식 Career 페이지도 글로벌 성장 인재를 모집.",
    source: "사람인·잡코리아·달바 공식 Career",
    priority: "매우 높음",
  },
  {
    company: "한국콜마",
    category: "ODM",
    status: "진행중",
    roles: ["화장품 연구", "마케팅", "납기관리", "R&D", "품질관리", "협력처관리"],
    evidence: "현재 진행중 4건 확인. 경력사원은 화장품연구·마케팅·납기관리, 신입은 협력처관리·연구·품질관리 중심.",
    source: "사람인 채용정보",
    priority: "높음",
  },
  {
    company: "코스맥스",
    category: "ODM",
    status: "상시 관찰",
    roles: ["생산기획", "해외영업", "R&D", "품질", "SCM"],
    evidence: "ODM 사업 특성상 생산·R&D·품질·SCM·해외영업을 핵심 인재풀로 관리할 가치가 높은 기업.",
    source: "기업·산업 구조 기반 분석",
    priority: "높음",
  },
  {
    company: "브이티",
    category: "성장 인디 브랜드",
    status: "상시 관찰",
    roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "상품기획"],
    evidence: "일본·미국·유럽 확장 기업으로 해외 채널 및 브랜드 인재를 우선 소싱 대상으로 설정.",
    source: "기업 성장·사업 구조 기반 분석",
    priority: "높음",
  },
  {
    company: "구다이글로벌",
    category: "성장 인디 브랜드",
    status: "상시 관찰",
    roles: ["글로벌영업", "브랜드PM", "M&A/PMI", "유통", "마케팅"],
    evidence: "멀티브랜드 운영·글로벌 유통·M&A가 핵심이므로 브랜드 운영과 해외사업을 동시에 이해하는 인재가 중요.",
    source: "기업 사업 구조 기반 분석",
    priority: "높음",
  },
];

const priorityOrder: Record<string, number> = {
  "매우 높음": 0,
  "높음": 1,
  보통: 2,
};

export default function Recruiting() {
  const [filter, setFilter] = useState("전체");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesFilter = filter === "전체" || job.category === filter;
        const text = `${job.company} ${job.roles.join(" ")}`.toLowerCase();
        const matchesQuery = !query || text.includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [filter, query]);

  const filters = ["전체", "대형 종합 뷰티", "성장 인디 브랜드", "ODM", "플랫폼·유통"];

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ fontSize: 13, color: "#666", letterSpacing: 2 }}>
        2026 K-BEAUTY INDUSTRY LANDSCAPE · RECRUITING
      </div>

      <h1 style={{ fontSize: 42, margin: "12px 0" }}>채용수요 분석</h1>
      <p style={{ color: "#666", lineHeight: 1.7 }}>
        기업의 실제 채용공고와 사업 확장 방향을 연결해 헤드헌팅 우선순위를 정리합니다.
        ‘진행중’과 ‘상시 관찰’을 구분해 과장된 채용수요를 만들지 않습니다.
      </p>

      <div style={{ display: "flex", gap: 10, margin: "24px 0", flexWrap: "wrap" }}>
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={{
              padding: "10px 16px",
              border: "1px solid #ddd",
              borderRadius: 999,
              background: filter === item ? "#111" : "#fff",
              color: filter === item ? "#fff" : "#111",
            }}
          >
            {item}
          </button>
        ))}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="기업·직무 검색"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 999,
            minWidth: 240,
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {visible.map((job) => (
          <article
            key={job.company}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 4px 16px rgba(0,0,0,.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: "#666" }}>{job.category}</span>
                <h2 style={{ margin: "6px 0" }}>{job.company}</h2>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: job.status === "진행중" ? "#e8f7ed" : "#f2f2f2",
                    fontSize: 12,
                  }}
                >
                  {job.status}
                </span>
                <b>{job.priority}</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
              {job.roles.map((role) => (
                <span
                  key={role}
                  style={{
                    padding: "7px 10px",
                    background: "#f6f6f6",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  {role}
                </span>
              ))}
            </div>

            <p style={{ lineHeight: 1.7, margin: "8px 0" }}>
              <b>채용/수요 근거</b> · {job.evidence}
            </p>
            <p style={{ fontSize: 12, color: "#777", margin: 0 }}>출처: {job.source}</p>
          </article>
        ))}
      </div>

      <section
        style={{
          marginTop: 28,
          padding: 22,
          border: "1px solid #ddd",
          borderRadius: 16,
          background: "#fafafa",
        }}
      >
        <h2>헤드헌터 활용법</h2>
        <ol style={{ lineHeight: 1.9, color: "#444" }}>
          <li>‘진행중’ 기업부터 실제 공고와 후보자 경력을 매칭합니다.</li>
          <li>‘상시 관찰’ 기업은 사업 확장 신호가 확인될 때 우선 접촉합니다.</li>
          <li>해외영업·글로벌마케팅·이커머스는 K-뷰티 성장기업 공통 소싱 직무로 별도 인재풀을 구축합니다.</li>
          <li>생산·R&D·품질·SCM은 ODM 기업 전용 인재풀로 분리합니다.</li>
        </ol>
      </section>

      <p style={{ marginTop: 24, color: "#777", fontSize: 12 }}>
        데이터 기준: 2026년 웹 검색에서 확인한 채용공고 및 기업 공식 Career 정보. 공고는 변동될 수 있으므로 실제 추천 전 원문 확인이 필요합니다.
      </p>
    </main>
  );
}
