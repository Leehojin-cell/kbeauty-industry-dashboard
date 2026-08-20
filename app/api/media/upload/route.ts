import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authenticated = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/*", "image/*"],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload token error" }, { status: 400 });
  }
}
