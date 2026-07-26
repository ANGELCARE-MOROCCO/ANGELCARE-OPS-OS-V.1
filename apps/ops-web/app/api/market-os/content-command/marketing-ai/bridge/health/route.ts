import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { getMarketingAiBridgeHealth } from '@/lib/market-os/marketing-ai/bridge'

export async function GET() {
  try {
    await requireMarketingAiUser('view')
    return NextResponse.json({ ok: true, ...(await getMarketingAiBridgeHealth()) })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
