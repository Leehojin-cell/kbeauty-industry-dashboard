import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyAuthToken } from '../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const kind = String(body.kind || '');
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!['docx', 'xlsx', 'pptx'].includes(kind)) return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });

  try {
    if (kind === 'xlsx') {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '미디어');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      return new NextResponse(buffer as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="kbeauty-media.xlsx"' } });
    }

    if (kind === 'docx') {
      const { Document, Packer, Paragraph } = await import('docx');
      const doc = new Document({ sections: [{ children: [new Paragraph('K-뷰티 미디어 관리 보고서'), ...rows.map((r:Record<string,string>) => new Paragraph(`${r.종류 || ''} | ${r.제목 || ''} | ${r.URL || ''} | ${r.등록일 || ''}`))] }] });
      const buffer = await Packer.toBuffer(doc);
      return new NextResponse(buffer as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="kbeauty-media.docx"' } });
    }

    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    const first = pptx.addSlide();
    first.addText('K-뷰티 미디어 관리 보고서', { x: 0.5, y: 0.35, w: 12, h: 0.5, fontSize: 24, bold: true });
    rows.slice(0, 18).forEach((r:Record<string,string>, i:number) => first.addText(`${i + 1}. ${r.제목 || ''} (${r.종류 || ''})`, { x: 0.7, y: 1.1 + i * 0.32, w: 11.5, h: 0.22, fontSize: 11 }));
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    return new NextResponse(buffer as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Content-Disposition': 'attachment; filename="kbeauty-media.pptx"' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '파일 생성에 실패했습니다.' }, { status: 500 });
  }
}
