import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { getMarketingAiConfig } from '@/lib/market-os/marketing-ai/config'
import { getMarketAiRuntimeStatus } from '@/lib/market-os/ai-runtime/gateway'
import { getMarketingAiDashboard } from '@/lib/market-os/marketing-ai/repository'

export const dynamic = 'force-dynamic'
async function GET__angelcareGovernedImpl() {
  try {
    await requireMarketingAiUser('view')
    const config = getMarketingAiConfig()
    const runtime = await getMarketAiRuntimeStatus(false)
    const structured = runtime.capabilities.find((item) => item.capability === 'structured_content')
    const research = runtime.capabilities.find((item) => item.capability === 'web_research')
    const snapshot = await getMarketingAiDashboard({
      enabled: config.enabled,
      configured: Boolean(structured?.configured || research?.configured),
      model: structured?.model || config.primaryModel,
      searchGrounding: Boolean(research?.configured),
      externalActionsAllowed: false,
    })
    return NextResponse.json({ ok: true, snapshot: { ...snapshot, runtime } })
  } catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/dashboard',
  },
  GET__angelcareGovernedImpl,
)
