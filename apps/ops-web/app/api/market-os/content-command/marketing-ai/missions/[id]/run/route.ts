import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { executeMarketingAiMission } from '@/lib/market-os/marketing-ai/orchestrator'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireMarketingAiUser('run')
    const { id } = await context.params
    const runs = await executeMarketingAiMission({ missionId: id, actor })
    return NextResponse.json({ ok: true, runs })
  } catch (error) { return apiErrorResponse(error) }
}
