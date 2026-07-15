import { NextResponse } from 'next/server'
import { exportModulesCommand } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json'
    const result = await exportModulesCommand(format)
    return new NextResponse(result.body, {
      headers: {
        'content-type': result.contentType,
        'content-disposition': `attachment; filename="${result.filename}"`,
        'cache-control': 'no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown modules export error' }, { status: 500 })
  }
}
