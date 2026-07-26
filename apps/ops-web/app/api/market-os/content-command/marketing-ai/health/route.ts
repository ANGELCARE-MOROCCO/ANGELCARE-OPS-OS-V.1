import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { checkMarketingAiHealth } from '@/lib/market-os/marketing-ai/provider'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    await requireMarketingAiUser('view')
    const live = new URL(request.url).searchParams.get('live') === '1'
    const health = await checkMarketingAiHealth(live)
    return NextResponse.json({ ok: true, health, externalActionsAllowed: false })
  } catch (error) { return apiErrorResponse(error) }
}
