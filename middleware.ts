import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAuthToken } from "./lib/auth";

// The landing page is public. Everything else is an authenticated recruiter/admin area.
const PUBLIC_PAGE_PATHS = ["/", "/login"];
const PUBLIC_API_PATHS = ["/api/login", "/api/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPublicPage = PUBLIC_PAGE_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`))
  );
  const isPublicApi = PUBLIC_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // Public landing page and authentication endpoints remain accessible without login.
  if ((isPublicPage && !isApi) || isPublicApi) {
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
  // Apply authentication to every application route, while excluding Next.js internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
