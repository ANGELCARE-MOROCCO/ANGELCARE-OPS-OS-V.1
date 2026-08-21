import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { runCommandSchema } from '@/lib/market-os/marketing-ai/schemas'
import { executeMarketingAiCommand } from '@/lib/market-os/marketing-ai/orchestrator'
import { listMarketingAiRuns } from '@/lib/market-os/marketing-ai/repository'

async function GET__angelcareGovernedImpl(request: Request) {
  try { await requireMarketingAiUser('view'); const limit = Math.min(200, Number(new URL(request.url).searchParams.get('limit') || 100)); return NextResponse.json({ ok: true, runs: await listMarketingAiRuns(limit) }) }
  catch (error) { return apiErrorResponse(error) }
}
async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const actor = await requireMarketingAiUser('run')
    const parsed = runCommandSchema.parse(await request.json())
    if (parsed.authorityMode === 'orchestrate_internal') throw new Error('COMPILATION_REQUIRED_FOR_INTERNAL_ORCHESTRATION')
    const run = await executeMarketingAiCommand({ ...parsed, authorityMode: parsed.authorityMode || 'prepare', context: { ...parsed.context, executionPath: 'advisory_manual_run', institutionalAcceptance: false }, actor })
    return NextResponse.json({ ok: true, run })
  } catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/runs',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/runs',
  },
  POST__angelcareGovernedImpl,
)
