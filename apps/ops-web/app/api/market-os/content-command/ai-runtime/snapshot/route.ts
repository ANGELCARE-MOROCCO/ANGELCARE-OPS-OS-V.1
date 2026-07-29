import { NextRequest } from 'next/server'
import { requireMarketingAiUser, apiErrorResponse } from '@/lib/market-os/marketing-ai/auth'
import { loadRuntimeControlSnapshot } from '@/lib/market-os/ai-runtime/control-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireMarketingAiUser(request.nextUrl.searchParams.get('live') === '1' ? 'run' : 'view')
    return Response.json({ ok: true, snapshot: await loadRuntimeControlSnapshot({ live: request.nextUrl.searchParams.get('live') === '1' }) })
  } catch (error) { return apiErrorResponse(error) }
}
