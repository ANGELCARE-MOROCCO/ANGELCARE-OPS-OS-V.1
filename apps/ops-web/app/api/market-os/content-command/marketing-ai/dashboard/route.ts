import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { getMarketingAiConfig } from '@/lib/market-os/marketing-ai/config'
import { getMarketingAiDashboard } from '@/lib/market-os/marketing-ai/repository'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await requireMarketingAiUser('view')
    const config = getMarketingAiConfig()
    const snapshot = await getMarketingAiDashboard({ enabled: config.enabled, configured: Boolean(config.apiKey), model: config.primaryModel, searchGrounding: config.searchGroundingEnabled, externalActionsAllowed: false })
    return NextResponse.json({ ok: true, snapshot })
  } catch (error) { return apiErrorResponse(error) }
}
