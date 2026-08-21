import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listInternalActionQueue } from '@/lib/market-os/marketing-ai/repository'
async function GET__angelcareGovernedImpl() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, actions: await listInternalActionQueue() }) }
  catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/actions',
  },
  GET__angelcareGovernedImpl,
)
