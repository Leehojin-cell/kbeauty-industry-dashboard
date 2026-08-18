import { NextResponse } from "next/server";

export const runtime = "nodejs";

const model = process.env.OPENAI_MODEL || "gpt-5.6";

type Company = {
  name: string;
  category: string;
  roles: string[];
  markets: string[];
  point: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 Vercel 환경변수에 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const resume = typeof body.resume === "string" ? body.resume.trim() : "";
    const companies = Array.isArray(body.companies) ? (body.companies as Company[]) : [];

    if (!resume) return NextResponse.json({ error: "이력서 내용이 없습니다." }, { status: 400 });
    if (!companies.length) return NextResponse.json({ error: "기업 데이터가 없습니다." }, { status: 400 });
    if (resume.length > 60000) return NextResponse.json({ error: "이력서가 너무 깁니다. 60,000자 이내로 입력해 주세요." }, { status: 413 });

    const companyText = companies
      .map((c, i) => `${i + 1}. ${c.name} | ${c.category} | 직무: ${c.roles.join(", ")} | 시장: ${c.markets.join(", ")} | 기준: ${c.point}`)
      .join("\n");

    const prompt = `당신은 한국 뷰티·화장품 업계 전문 헤드헌터의 후보자 매칭 분석가다.
아래 이력서를 읽고 등록된 K-뷰티 기업 각각에 대해 실제 채용 관점의 적합도를 분석하라.
단순 키워드 일치가 아니라 경력의 문맥, 산업 전환 가능성, 담당 시장, 직무 연관성, 최근 경력의 중요도를 종합하라.
이력서에 없는 경력은 있다고 추정하지 말라. 불확실하면 반드시 "확인 필요"라고 표시하라.
점수는 0~100의 상대적 1차 스크리닝 점수이며, 과장된 고득점을 피하라.
특히 최근 화장품/뷰티 경력이 짧더라도 이전 경력에서 이전 가능한 역량이 명확하면 그 점을 설명하라.
결과는 반드시 JSON 객체 하나만 출력하라. 마크다운 코드블록을 사용하지 마라.

이력서:
${resume}

기업 목록:
${companyText}

JSON 형식:
{
  "candidate_summary": "후보자의 핵심 경력과 포지셔닝을 3~5문장으로 요약",
  "recommended_role": "가장 적합한 직무",
  "recommended_market": "가장 적합한 시장",
  "top_recommendations": [
    {
      "company": "기업명",
      "score": 0,
      "verdict": "강력 추천|추천|조건부 추천|비추천",
      "why": ["핵심 근거 1", "핵심 근거 2", "핵심 근거 3"],
      "strengths": ["후보자 강점"],
      "gaps": ["부족하거나 확인할 부분"],
      "role": "추천 직무",
      "market": "추천 시장",
      "recruiter_note": "고객사 제출용 3~5문장 추천문안"
    }
  ],
  "resume_improvements": ["이력서 보완사항 1", "이력서 보완사항 2", "이력서 보완사항 3"]
}
상위 추천은 최대 10개까지 포함하라.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `OpenAI API 오류: ${detail.slice(0, 500)}` }, { status: 502 });
    }

    const data = await response.json();
    const outputText = typeof data.output_text === "string" ? data.output_text : "";
    if (!outputText) return NextResponse.json({ error: "AI 응답이 비어 있습니다." }, { status: 502 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      const cleaned = outputText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json({ ...parsed as object, model });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
