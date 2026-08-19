import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";
import { dbConfigured, sql } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: false, configured: false, research: [] }, { status: 503 });
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ ok: false, error: "companyId 필요" }, { status: 400 });
  const result = await sql`SELECT * FROM company_research WHERE company_id=${companyId} ORDER BY created_at DESC`;
  return NextResponse.json({ ok: true, research: result.rows });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value)) return NextResponse.json({ ok: false, error: "관리자 로그인 필요" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "POSTGRES_URL 미설정" }, { status: 503 });
  const body = await request.json();
  if (!body.companyId || !body.field || !body.value) return NextResponse.json({ ok: false, error: "조사 데이터가 부족합니다." }, { status: 400 });
  const result = await sql`INSERT INTO company_research(company_id, field, value, source_url, source_name, source_date, confidence) VALUES(${body.companyId}, ${body.field}, ${body.value}, ${body.sourceUrl||""}, ${body.sourceName||""}, ${body.sourceDate||null}, ${body.confidence||"unverified"}) RETURNING *`;
  return NextResponse.json({ ok: true, research: result.rows[0] });
}
