import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { loadReportCardPdf } from '@/lib/angelcare360/server/product-reality'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const result = await loadReportCardPdf(id, request.nextUrl.searchParams.get('version'))
    return new NextResponse(result.bytes as BodyInit, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${result.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_')}"`,
        'cache-control': 'private, no-store, max-age=0',
      },
    })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Le PDF ne peut pas être généré.' }, { status: 500 })
  }
}
