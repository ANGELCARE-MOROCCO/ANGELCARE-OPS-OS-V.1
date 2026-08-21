import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listMarketingAiSkills } from '@/lib/market-os/marketing-ai/repository'

export const dynamic = 'force-dynamic'
async function GET__angelcareGovernedImpl() {
  try { await requireMarketingAiUser('view'); const result = await listMarketingAiSkills(); return NextResponse.json({ ok: true, ...result }) }
  catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/skills',
  },
  GET__angelcareGovernedImpl,
)
