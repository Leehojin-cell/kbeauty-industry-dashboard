import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value)) return NextResponse.json({ ok: false, error: "관리자 로그인 필요" }, { status: 401 });
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, configured: false, error: "DART_API_KEY 미설정" }, { status: 503 });

  const url = new URL(request.url);
  const corpCode = url.searchParams.get("corpCode");
  const bsnsYear = url.searchParams.get("year") || String(new Date().getFullYear() - 1);
  const reprtCode = url.searchParams.get("reprtCode") || "11011";
  if (!corpCode) return NextResponse.json({ ok: false, error: "corpCode 필요" }, { status: 400 });

  const api = new URL("https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json");
  api.searchParams.set("crtfc_key", apiKey);
  api.searchParams.set("corp_code", corpCode);
  api.searchParams.set("bsns_year", bsnsYear);
  api.searchParams.set("reprt_code", reprtCode);
  api.searchParams.set("fs_div", "CFS");
  const response = await fetch(api, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ ok: false, error: `DART HTTP ${response.status}` }, { status: 502 });
  const data = await response.json();
  return NextResponse.json({ ok: true, source: "DART", year: bsnsYear, corpCode, data });
}
