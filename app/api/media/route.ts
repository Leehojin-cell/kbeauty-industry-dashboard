import { del } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAuthToken } from "../../../lib/auth";

async function requireAuth() {
  const store = await cookies();
  return verifyAuthToken(store.get(COOKIE_NAME)?.value);
}

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

async function ensureTables(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS media_directories (id TEXT PRIMARY KEY, media_type TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT REFERENCES media_directories(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS media_items (id TEXT PRIMARY KEY, directory_id TEXT REFERENCES media_directories(id) ON DELETE SET NULL, media_type TEXT NOT NULL, title TEXT NOT NULL, file_url TEXT, blob_pathname TEXT, youtube_url TEXT, thumbnail_url TEXT, mime_type TEXT, size_bytes BIGINT, metadata_json JSONB, sort_order INTEGER NOT NULL DEFAULT 0, deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`ALTER TABLE media_directories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES media_directories(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE media_directories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`;
  await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS metadata_json JSONB`;
  await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_directories_parent ON media_directories(media_type, parent_id, sort_order)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_items_folder ON media_items(media_type, directory_id, sort_order)`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return "알 수 없는 서버 오류"; }
}

function missingDbResponse() {
  return NextResponse.json({ error: "Vercel 프로젝트의 DATABASE_URL이 필요합니다. Neon 연결 후 Production 환경변수를 확인해주세요.", code: "DATABASE_URL_MISSING" }, { status: 503 });
}

function youtubeVideoId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.hostname.endsWith("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v") || "";
      const match = url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);
      return match?.[1] || "";
    }
  } catch {}
  return "";
}

async function youtubeMetadata(url: string) {
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { cache: "no-store" });
  if (!response.ok) throw new Error("YouTube 영상 정보를 가져오지 못했습니다.");
  const data = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
  const id = youtubeVideoId(url);
  return {
    title: data.title || "YouTube 영상",
    thumbnailUrl: data.thumbnail_url || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null),
    authorName: data.author_name || null,
  };
}

async function directoryRows(sql: ReturnType<typeof neon>, mediaType?: string) {
  if (mediaType) return sql`SELECT id, media_type, name, parent_id, sort_order, created_at FROM media_directories WHERE media_type = ${mediaType} ORDER BY sort_order ASC, name ASC`;
  return sql`SELECT id, media_type, name, parent_id, sort_order, created_at FROM media_directories ORDER BY media_type ASC, sort_order ASC, name ASC`;
}

export async function GET(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getSql();
  if (!sql) return missingDbResponse();
  try {
    await ensureTables(sql);
    const url = new URL(request.url);
    if (url.searchParams.get("youtube") === "1") {
      const value = url.searchParams.get("url") || "";
      if (!youtubeVideoId(value)) return NextResponse.json({ error: "유효한 YouTube URL을 넣어주세요." }, { status: 400 });
      return NextResponse.json(await youtubeMetadata(value));
    }
    const [directories, items] = await Promise.all([
      directoryRows(sql),
      sql`SELECT id, directory_id, media_type, title, file_url, blob_pathname, youtube_url, thumbnail_url, mime_type, size_bytes, metadata_json, sort_order, created_at FROM media_items WHERE deleted_at IS NULL ORDER BY media_type ASC, sort_order ASC, created_at DESC`,
    ]);
    return NextResponse.json({ directories, items });
  } catch (error) {
    return NextResponse.json({ error: `미디어 DB를 불러오지 못했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getSql();
  if (!sql) return missingDbResponse();
  try {
    await ensureTables(sql);
    const body = await request.json();
    if (body.action === "directory") {
      const mediaType = String(body.mediaType || "");
      const name = String(body.name || "").trim();
      const parentId = body.parentId ? String(body.parentId) : null;
      if (!["video", "youtube", "image"].includes(mediaType) || !name) return NextResponse.json({ error: "잘못된 디렉토리 정보입니다." }, { status: 400 });
      if (parentId) {
        const parent = await sql`SELECT id, media_type FROM media_directories WHERE id = ${parentId}`;
        if (!parent[0] || parent[0].media_type !== mediaType) return NextResponse.json({ error: "하위 디렉토리의 부모가 올바르지 않습니다." }, { status: 400 });
      }
      const max = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM media_directories WHERE media_type = ${mediaType} AND parent_id IS NOT DISTINCT FROM ${parentId}`;
      const id = crypto.randomUUID();
      const sortOrder = Number(max[0]?.next ?? 0);
      await sql`INSERT INTO media_directories (id, media_type, name, parent_id, sort_order) VALUES (${id}, ${mediaType}, ${name}, ${parentId}, ${sortOrder})`;
      return NextResponse.json({ id, mediaType, name, parentId, sortOrder });
    }
    if (body.action === "item") {
      const mediaType = String(body.mediaType || "");
      const title = String(body.title || "").trim();
      const directoryId = body.directoryId ? String(body.directoryId) : null;
      if (!["video", "youtube", "image"].includes(mediaType) || !title) return NextResponse.json({ error: "잘못된 콘텐츠 정보입니다." }, { status: 400 });
      if (directoryId) {
        const folder = await sql`SELECT id, media_type FROM media_directories WHERE id = ${directoryId}`;
        if (!folder[0] || folder[0].media_type !== mediaType) return NextResponse.json({ error: "콘텐츠와 디렉토리 유형이 일치하지 않습니다." }, { status: 400 });
      }
      let titleValue = title;
      let thumbnailUrl = body.thumbnailUrl ? String(body.thumbnailUrl) : null;
      let metadata = body.metadata || null;
      if (mediaType === "youtube" && body.youtubeUrl) {
        const meta = await youtubeMetadata(String(body.youtubeUrl));
        titleValue = meta.title;
        thumbnailUrl = meta.thumbnailUrl;
        metadata = { ...(metadata || {}), authorName: meta.authorName };
      }
      const max = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM media_items WHERE media_type = ${mediaType} AND directory_id IS NOT DISTINCT FROM ${directoryId} AND deleted_at IS NULL`;
      const id = crypto.randomUUID();
      await sql`INSERT INTO media_items (id, directory_id, media_type, title, file_url, blob_pathname, youtube_url, thumbnail_url, mime_type, size_bytes, metadata_json, sort_order) VALUES (${id}, ${directoryId}, ${mediaType}, ${titleValue}, ${body.fileUrl || null}, ${body.blobPathname || null}, ${body.youtubeUrl || null}, ${thumbnailUrl}, ${body.mimeType || null}, ${body.sizeBytes ? Number(body.sizeBytes) : null}, ${metadata ? JSON.stringify(metadata) : null}, ${Number(max[0]?.next ?? 0)})`;
      return NextResponse.json({ id, title: titleValue, thumbnailUrl });
    }
    return NextResponse.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: `미디어 저장 중 DB 오류가 발생했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getSql();
  if (!sql) return missingDbResponse();
  try {
    await ensureTables(sql);
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    if (body.entity === "item") {
      const directoryId = body.directoryId === null || body.directoryId === "" ? null : String(body.directoryId);
      const sortOrder = Number(body.sortOrder ?? 0);
      await sql`UPDATE media_items SET directory_id = ${directoryId}, sort_order = ${sortOrder} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }
    const row = await sql`SELECT id, media_type, parent_id FROM media_directories WHERE id = ${id}`;
    if (!row[0]) return NextResponse.json({ error: "디렉토리를 찾지 못했습니다." }, { status: 404 });
    const parentId = body.parentId === null || body.parentId === "" ? null : String(body.parentId);
    if (parentId === id) return NextResponse.json({ error: "자기 자신을 하위 디렉토리로 지정할 수 없습니다." }, { status: 400 });
    if (parentId) {
      const parent = await sql`SELECT id, media_type FROM media_directories WHERE id = ${parentId}`;
      if (!parent[0] || parent[0].media_type !== row[0].media_type) return NextResponse.json({ error: "부모 디렉토리가 올바르지 않습니다." }, { status: 400 });
      const descendants = await sql`WITH RECURSIVE tree AS (SELECT id FROM media_directories WHERE id = ${id} UNION ALL SELECT d.id FROM media_directories d JOIN tree t ON d.parent_id = t.id) SELECT id FROM tree WHERE id = ${parentId}`;
      if (descendants[0]) return NextResponse.json({ error: "하위 디렉토리 안으로 이동할 수 없습니다." }, { status: 400 });
    }
    const name = body.name === undefined ? null : String(body.name).trim();
    const sortOrder = Number(body.sortOrder ?? 0);
    await sql`UPDATE media_directories SET name = COALESCE(${name}, name), parent_id = ${parentId}, sort_order = ${sortOrder}, updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: `정렬/디렉토리 수정 중 DB 오류가 발생했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getSql();
  if (!sql) return missingDbResponse();
  try {
    await ensureTables(sql);
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const directory = params.get("directory") === "1";
    if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    if (directory) {
      const folders = await sql`WITH RECURSIVE tree AS (SELECT id FROM media_directories WHERE id = ${id} UNION ALL SELECT d.id FROM media_directories d JOIN tree t ON d.parent_id = t.id) SELECT id FROM tree`;
      const folderIds = folders.map((r) => String(r.id));
      if (!folderIds.length) return NextResponse.json({ error: "디렉토리를 찾지 못했습니다." }, { status: 404 });
      const items = await sql`SELECT id, blob_pathname FROM media_items WHERE directory_id = ANY(${folderIds})`;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        for (const item of items) if (item.blob_pathname) { try { await del(String(item.blob_pathname), { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {} }
      }
      await sql`DELETE FROM media_items WHERE directory_id = ANY(${folderIds})`;
      await sql`DELETE FROM media_directories WHERE id = ANY(${folderIds})`;
      return NextResponse.json({ ok: true });
    }
    const rows = await sql`SELECT blob_pathname FROM media_items WHERE id = ${id}`;
    if (rows[0]?.blob_pathname && process.env.BLOB_READ_WRITE_TOKEN) { try { await del(String(rows[0].blob_pathname), { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {} }
    await sql`DELETE FROM media_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: `삭제 중 DB 오류가 발생했습니다: ${errorMessage(error)}` }, { status: 500 });
  }
}
