import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authenticated = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      error: "Vercel Blob이 연결되지 않았습니다. Vercel 프로젝트의 Storage에서 Blob Store를 연결하고 BLOB_READ_WRITE_TOKEN을 Production에 설정한 뒤 재배포해주세요.",
      code: "BLOB_READ_WRITE_TOKEN_MISSING",
    }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/*", "image/*", "application/pdf"],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload token error" }, { status: 400 });
  }
}
