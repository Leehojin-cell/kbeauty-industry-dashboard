import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_SECONDS, createAuthToken } from "../../../lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "관리자 인증 환경변수가 아직 설정되지 않았습니다." }, { status: 500 });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createAuthToken(email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}
