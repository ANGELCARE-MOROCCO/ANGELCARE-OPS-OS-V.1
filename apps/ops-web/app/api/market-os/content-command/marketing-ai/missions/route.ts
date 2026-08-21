import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { missionInputSchema } from '@/lib/market-os/marketing-ai/schemas'
import { createMarketingAiMission, listMarketingAiMissions } from '@/lib/market-os/marketing-ai/repository'

async function GET__angelcareGovernedImpl() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, missions: await listMarketingAiMissions() }) }
  catch (error) { return apiErrorResponse(error) }
}
async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const actor = await requireMarketingAiUser('manage')
    const parsed = missionInputSchema.parse(await request.json())
    const mission = await createMarketingAiMission(parsed, actor)
    return NextResponse.json({ ok: true, mission })
  } catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/missions',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/missions',
  },
  POST__angelcareGovernedImpl,
)
