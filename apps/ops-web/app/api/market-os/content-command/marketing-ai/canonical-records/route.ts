import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listCanonicalMarketingRecords } from '@/lib/market-os/marketing-ai/phase3-repository'

export async function GET(request: Request) {
  try {
    await requireMarketingAiUser('view')
    const limit = Math.min(300, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 100)))
    return Response.json({ ok: true, records: await listCanonicalMarketingRecords(limit) })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
