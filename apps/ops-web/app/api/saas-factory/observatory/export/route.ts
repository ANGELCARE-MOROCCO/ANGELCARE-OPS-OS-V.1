import { exportObservatory } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'json'
  const exported = await exportObservatory(format)
  return new Response(exported.body, {
    headers: {
      'Content-Type': exported.contentType,
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
