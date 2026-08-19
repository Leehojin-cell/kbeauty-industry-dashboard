import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";
import { dbConfigured, sql } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: false, configured: false, financials: [] }, { status: 503 });
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ ok: false, error: "companyId 필요" }, { status: 400 });
  const result = await sql`
    SELECT * FROM company_financials
    WHERE company_id=${companyId}
    ORDER BY fiscal_year DESC, fetched_at DESC
  `;
  return NextResponse.json({ ok: true, configured: true, financials: result.rows });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false, error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "POSTGRES_URL 미설정" }, { status: 503 });

  const body = await request.json();
  const companyId = String(body.companyId || "").trim();
  const fiscalYear = Number(body.fiscalYear);
  const separateRevenue = Number(body.separateRevenue);
  const consolidatedRevenue = body.consolidatedRevenue === "" || body.consolidatedRevenue == null ? null : Number(body.consolidatedRevenue);
  const source = String(body.source || "manual").trim();
  const sourceUrl = String(body.sourceUrl || "").trim();

  if (!companyId || !Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100 || !Number.isFinite(separateRevenue) || separateRevenue < 0) {
    return NextResponse.json({ ok: false, error: "기업, 연도, 별도매출을 확인해 주세요." }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO company_financials(company_id, fiscal_year, separate_revenue, consolidated_revenue, source, source_url)
    VALUES(${companyId}, ${fiscalYear}, ${Math.round(separateRevenue)}, ${consolidatedRevenue == null || !Number.isFinite(consolidatedRevenue) ? null : Math.round(consolidatedRevenue)}, ${source || "manual"}, ${sourceUrl})
    ON CONFLICT(company_id, fiscal_year, source)
    DO UPDATE SET separate_revenue=EXCLUDED.separate_revenue, consolidated_revenue=EXCLUDED.consolidated_revenue, source_url=EXCLUDED.source_url, fetched_at=NOW()
    RETURNING *
  `;

  await sql`
    UPDATE companies
    SET revenue_2025 = CASE WHEN ${fiscalYear}=2025 THEN ${Math.round(separateRevenue)} ELSE revenue_2025 END,
        revenue_2024 = CASE WHEN ${fiscalYear}=2024 THEN ${Math.round(separateRevenue)} ELSE revenue_2024 END,
        revenue_2025_consolidated = CASE WHEN ${fiscalYear}=2025 AND ${consolidatedRevenue == null ? null : Math.round(consolidatedRevenue)} IS NOT NULL THEN ${consolidatedRevenue == null ? 0 : Math.round(consolidatedRevenue)} ELSE revenue_2025_consolidated END,
        revenue_2024_consolidated = CASE WHEN ${fiscalYear}=2024 AND ${consolidatedRevenue == null ? null : Math.round(consolidatedRevenue)} IS NOT NULL THEN ${consolidatedRevenue == null ? 0 : Math.round(consolidatedRevenue)} ELSE revenue_2024_consolidated END,
        updated_at=NOW()
    WHERE id=${companyId}
  `;

  return NextResponse.json({ ok: true, financial: result.rows[0] });
}
