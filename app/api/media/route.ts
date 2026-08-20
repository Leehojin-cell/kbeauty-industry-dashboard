import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";

async function requireAuth() {
  const store = await cookies();
  return verifyAuthToken(store.get(COOKIE_NAME)?.value);
}

function dbConfigured() {
  return Boolean(process.env.POSTGRES_URL);
}

async function ensureTables() {
  await sql`CREATE TABLE IF NOT EXISTS media_directories (id TEXT PRIMARY KEY, media_type TEXT NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS media_items (id TEXT PRIMARY KEY, directory_id TEXT REFERENCES media_directories(id) ON DELETE SET NULL, media_type TEXT NOT NULL, title TEXT NOT NULL, file_url TEXT, blob_pathname TEXT, youtube_url TEXT, mime_type TEXT, size_bytes BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_directories_type ON media_directories(media_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(media_type)`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return "알 수 없는 서버 오류"; }
}

function missingDbResponse() {
  return NextResponse.json({
    error: "미디어 서버 저장을 사용하려면 Vercel 프로젝트에 PostgreSQL을 연결하고 POSTGRES_URL을 Production 환경변수로 설정해야 합니다.",
    code: "POSTGRES_URL_MISSING",
  }, { status: 503 });
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbConfigured()) return missingDbResponse();
  try {
    await ensureTables();
    const [directories, items] = await Promise.all([
      sql`SELECT id, media_type, name FROM media_directories ORDER BY media_type, name`,
      sql`SELECT id, directory_id, media_type, title, file_url, youtube_url, mime_type, size_bytes, created_at FROM media_items ORDER BY created_at DESC`,
    ]);
    return NextResponse.json({ directories: directories.rows, items: items.rows });
  } catch (error) {
    return NextResponse.json({ error: `미디어 DB를 불러오지 못했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbConfigured()) return missingDbResponse();
  try {
    await ensureTables();
    const body = await request.json();
    if (body.action === "directory") {
      const mediaType = String(body.mediaType || "");
      const name = String(body.name || "").trim();
      if (!["video", "youtube", "image"].includes(mediaType) || !name) {
        return NextResponse.json({ error: "잘못된 디렉토리 정보입니다." }, { status: 400 });
      }
      const id = crypto.randomUUID();
      await sql`INSERT INTO media_directories (id, media_type, name) VALUES (${id}, ${mediaType}, ${name})`;
      return NextResponse.json({ id, mediaType, name });
    }
    if (body.action === "item") {
      const mediaType = String(body.mediaType || "");
      const title = String(body.title || "").trim();
      if (!["video", "youtube", "image"].includes(mediaType) || !title) {
        return NextResponse.json({ error: "잘못된 콘텐츠 정보입니다." }, { status: 400 });
      }
      const id = crypto.randomUUID();
      await sql`INSERT INTO media_items (id, directory_id, media_type, title, file_url, blob_pathname, youtube_url, mime_type, size_bytes) VALUES (${id}, ${body.directoryId || null}, ${mediaType}, ${title}, ${body.fileUrl || null}, ${body.blobPathname || null}, ${body.youtubeUrl || null}, ${body.mimeType || null}, ${body.sizeBytes ? Number(body.sizeBytes) : null})`;
      return NextResponse.json({ id });
    }
    return NextResponse.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: `디렉토리/콘텐츠 저장 중 DB 오류가 발생했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbConfigured()) return missingDbResponse();
  try {
    await ensureTables();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    await sql`DELETE FROM media_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: `콘텐츠 삭제 중 DB 오류가 발생했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}
