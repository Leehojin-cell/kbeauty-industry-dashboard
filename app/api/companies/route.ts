import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";
import { dbConfigured, sql } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!dbConfigured()) return NextResponse.json({ ok: false, configured: false, companies: [] }, { status: 503 });
  const result = await sql`SELECT * FROM companies ORDER BY manual_order ASC, company ASC`;
  return NextResponse.json({ ok: true, configured: true, companies: result.rows });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const loggedIn = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!loggedIn) return NextResponse.json({ ok: false, error: "관리자 로그인 필요" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "POSTGRES_URL 미설정" }, { status: 503 });

  const body = await request.json();
  const c = body.company;
  if (!c?.id || !c?.company) return NextResponse.json({ ok: false, error: "기업 데이터가 부족합니다." }, { status: 400 });

  await sql`
    INSERT INTO companies (id, category, company, revenue_2025, revenue_2025_consolidated, revenue_2024, revenue_2024_consolidated, brands, odm, items, ownership, location, hq, seoul_office, gyeonggi_office, factory, logistics, memo, manual_order)
    VALUES (${c.id}, ${c.category}, ${c.company}, ${Number(c.revenue2025)||0}, ${Number(c.revenue2025Consolidated)||0}, ${Number(c.revenue2024)||0}, ${Number(c.revenue2024Consolidated)||0}, ${c.brands||""}, ${c.odm||""}, ${c.items||""}, ${c.ownership||""}, ${c.location||""}, ${c.hq||""}, ${c.seoulOffice||""}, ${c.gyeonggiOffice||""}, ${c.factory||""}, ${c.logistics||""}, ${c.memo||""}, ${Number(c.manualOrder)||0})
    ON CONFLICT (id) DO UPDATE SET category=EXCLUDED.category, company=EXCLUDED.company, revenue_2025=EXCLUDED.revenue_2025, revenue_2025_consolidated=EXCLUDED.revenue_2025_consolidated, revenue_2024=EXCLUDED.revenue_2024, revenue_2024_consolidated=EXCLUDED.revenue_2024_consolidated, brands=EXCLUDED.brands, odm=EXCLUDED.odm, items=EXCLUDED.items, ownership=EXCLUDED.ownership, location=EXCLUDED.location, hq=EXCLUDED.hq, seoul_office=EXCLUDED.seoul_office, gyeonggi_office=EXCLUDED.gyeonggi_office, factory=EXCLUDED.factory, logistics=EXCLUDED.logistics, memo=EXCLUDED.memo, manual_order=EXCLUDED.manual_order, updated_at=NOW()
  `;
  return NextResponse.json({ ok: true });
}
