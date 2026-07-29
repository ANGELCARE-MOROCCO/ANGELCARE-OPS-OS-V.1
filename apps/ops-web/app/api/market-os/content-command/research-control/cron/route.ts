import { NextResponse } from 'next/server'
import { getContentResearchConfig } from '@/lib/market-os/content-research/config'
import { runDueContentResearchAgents } from '@/lib/market-os/content-research/orchestrator'
import { runOpportunityIntelligence } from '@/lib/market-os/content-command-headquarters/opportunity-intelligence-service'

export const dynamic = 'force-dynamic'

function authorized(request: Request) {
  const config = getContentResearchConfig()
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || request.headers.get('x-market-os-research-cron-secret')
    || ''
  return Boolean(config.cronSecret && token === config.cronSecret)
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'RESEARCH_CRON_UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const result = await runDueContentResearchAgents()
    const opportunityMaterialization = await runOpportunityIntelligence({ actorId: 'system:research-cron', actorName: 'SANILA Opportunity Intelligence', reason: 'scheduled_research_materialization', continuationMode: 'without_research', scanWeb: false })
    return NextResponse.json({ ok: true, research: result, opportunityMaterialization })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'RESEARCH_CRON_FAILED' }, { status: 500 })
  }
}

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
