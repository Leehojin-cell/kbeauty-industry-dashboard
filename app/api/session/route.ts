import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuthToken(request.cookies.get(COOKIE_NAME)?.value);
  return NextResponse.json({ authenticated });
}
