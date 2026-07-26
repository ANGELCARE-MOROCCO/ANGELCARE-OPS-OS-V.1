import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { missionInputSchema } from '@/lib/market-os/marketing-ai/schemas'
import { createMarketingAiMission, listMarketingAiMissions } from '@/lib/market-os/marketing-ai/repository'

export async function GET() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, missions: await listMarketingAiMissions() }) }
  catch (error) { return apiErrorResponse(error) }
}
export async function POST(request: Request) {
  try {
    const actor = await requireMarketingAiUser('manage')
    const parsed = missionInputSchema.parse(await request.json())
    const mission = await createMarketingAiMission(parsed, actor)
    return NextResponse.json({ ok: true, mission })
  } catch (error) { return apiErrorResponse(error) }
}
