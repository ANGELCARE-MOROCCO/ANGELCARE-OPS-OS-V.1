import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { runCommandSchema } from '@/lib/market-os/marketing-ai/schemas'
import { executeMarketingAiCommand } from '@/lib/market-os/marketing-ai/orchestrator'
import { listMarketingAiRuns } from '@/lib/market-os/marketing-ai/repository'

export async function GET(request: Request) {
  try { await requireMarketingAiUser('view'); const limit = Math.min(200, Number(new URL(request.url).searchParams.get('limit') || 100)); return NextResponse.json({ ok: true, runs: await listMarketingAiRuns(limit) }) }
  catch (error) { return apiErrorResponse(error) }
}
export async function POST(request: Request) {
  try {
    const actor = await requireMarketingAiUser('run')
    const parsed = runCommandSchema.parse(await request.json())
    if (parsed.authorityMode === 'orchestrate_internal') throw new Error('COMPILATION_REQUIRED_FOR_INTERNAL_ORCHESTRATION')
    const run = await executeMarketingAiCommand({ ...parsed, authorityMode: parsed.authorityMode || 'prepare', context: { ...parsed.context, executionPath: 'advisory_manual_run', institutionalAcceptance: false }, actor })
    return NextResponse.json({ ok: true, run })
  } catch (error) { return apiErrorResponse(error) }
}
