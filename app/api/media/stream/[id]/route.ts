import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAuthToken } from '../../../../lib/auth';

type Sql = NeonQueryFunction<false, false>;

function getSql(): Sql | null {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!(await verifyAuthToken(store.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSql();
  if (!sql) return NextResponse.json({ error: 'DATABASE_URL_MISSING' }, { status: 503 });

  const { id } = await params;
  const rows = await sql`SELECT file_url, mime_type, title FROM media_items WHERE id = ${id} AND deleted_at IS NULL AND media_type = 'video'`;
  const row = rows[0] as { file_url?: string; mime_type?: string | null; title?: string } | undefined;
  if (!row?.file_url) return NextResponse.json({ error: '동영상 파일을 찾지 못했습니다.' }, { status: 404 });

  const range = request.headers.get('range');
  const upstream = await fetch(row.file_url, range ? { headers: { Range: range }, cache: 'no-store' } : { cache: 'no-store' });
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: '동영상 파일을 불러오지 못했습니다.' }, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', row.mime_type?.startsWith('video/') ? row.mime_type : 'video/mp4');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  if (row.title) headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(row.title)}`);
  for (const name of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
