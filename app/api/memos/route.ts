import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";
import { dbConfigured, sql } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: false, configured: false, memos: [] }, { status: 503 });
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ ok: false, error: "companyId 필요" }, { status: 400 });
  const result = await sql`SELECT id, company_id, author, memo, created_at, updated_at FROM company_memos WHERE company_id=${companyId} ORDER BY updated_at DESC`;
  return NextResponse.json({ ok: true, memos: result.rows });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value)) return NextResponse.json({ ok: false, error: "관리자 로그인 필요" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "POSTGRES_URL 미설정" }, { status: 503 });
  const { companyId, memo, author = "admin" } = await request.json();
  if (!companyId || !memo?.trim()) return NextResponse.json({ ok: false, error: "기업과 메모를 입력하세요." }, { status: 400 });
  const result = await sql`INSERT INTO company_memos(company_id, author, memo) VALUES(${companyId}, ${author}, ${memo.trim()}) RETURNING id, company_id, author, memo, created_at, updated_at`;
  return NextResponse.json({ ok: true, memo: result.rows[0] });
}
