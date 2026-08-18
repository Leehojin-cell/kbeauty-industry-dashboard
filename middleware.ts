import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAuthToken } from "./lib/auth";

const PRIVATE_PATHS = ["/recruiting", "/candidates", "/resume-upload", "/ai-match", "/resume-match", "/data-quality"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPrivatePage = PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isPrivatePage && (!isApi || pathname === "/api/login" || pathname === "/api/logout")) {
    return NextResponse.next();
  }

  const valid = await verifyAuthToken(request.cookies.get(COOKIE_NAME)?.value);
  if (valid) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/recruiting/:path*", "/candidates/:path*", "/resume-upload/:path*", "/ai-match/:path*", "/resume-match/:path*", "/data-quality/:path*", "/api/:path*"],
};
