import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuthToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!authenticated) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const { company } = await request.json();
  if (!company) return NextResponse.json({ error: "기업명이 필요합니다." }, { status: 400 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  const prompt = `한국 기업 ${company}의 현재 소유/지배 관계와 인수 이력을 인터넷에서 조사하세요. 공식 홈페이지와 금융감독원 DART, 회사 공시·공식 발표를 우선하세요. 현재 회사를 소유한 인수 주체가 확인되면 회사명만 간단히 적고, 인수 사실이 없거나 확인되지 않으면 해당 없음을 적으세요. 현재 본사 위치도 공식 홈페이지 기준으로 확인하세요. 반드시 JSON 하나만 반환하세요: {"acquisition":"...","location":"...","source":"..."}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "gpt-5-mini", tools: [{ type: "web_search" }], input: prompt }),
  });
  if (!response.ok) return NextResponse.json({ error: "인터넷 조사에 실패했습니다." }, { status: 502 });
  const data = await response.json();
  const text = String(data.output_text || "").trim();
  try {
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ acquisition: text || "확인 필요", location: "확인 필요", source: "인터넷 조사 결과" });
  }
}
