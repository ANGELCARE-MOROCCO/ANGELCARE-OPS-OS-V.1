import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listMarketingAiBridgeObjects } from '@/lib/market-os/marketing-ai/repository'

async function GET__angelcareGovernedImpl(request: Request) {
  try {
    await requireMarketingAiUser('view')
    const limit = Math.min(200, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 100)))
    return NextResponse.json({ ok: true, objects: await listMarketingAiBridgeObjects(limit) })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/bridge/objects',
  },
  GET__angelcareGovernedImpl,
)
