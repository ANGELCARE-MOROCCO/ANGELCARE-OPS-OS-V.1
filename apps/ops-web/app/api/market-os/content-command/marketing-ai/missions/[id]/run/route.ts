import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { compileMarketingMission } from '@/lib/market-os/marketing-ai/compiler'

async function POST__angelcareGovernedImpl(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireMarketingAiUser('manage')
    const { id } = await context.params
    const compiled = await compileMarketingMission({ missionId: id, actor })
    return NextResponse.json({ ok: true, mode: 'compile_only', externalExecution: false, ...compiled }, { status: 201 })
  } catch (error) { return apiErrorResponse(error) }
}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/missions/[id]/run',
  },
  POST__angelcareGovernedImpl,
)
