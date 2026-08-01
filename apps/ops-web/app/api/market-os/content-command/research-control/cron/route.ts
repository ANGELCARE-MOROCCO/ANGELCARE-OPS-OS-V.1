import { NextResponse } from 'next/server'
import { getContentResearchConfig } from '@/lib/market-os/content-research/config'
import { runDueContentResearchAgents } from '@/lib/market-os/content-research/orchestrator'
import { runOpportunityIntelligence } from '@/lib/market-os/content-command-headquarters/opportunity-intelligence-service'
import { assertProductionCapability, recordProductionIncident } from '@/lib/market-os/content-command-headquarters/production-operations-service'

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
    const policy = await assertProductionCapability('scheduled_scan')
    if (!policy.allowed) return NextResponse.json({ ok: true, skipped: true, reason: policy.reason, manualContinuity: true })
    const result = await runDueContentResearchAgents()
    const opportunityMaterialization = await runOpportunityIntelligence({ actorId: 'system:research-cron', actorName: 'SANILA Opportunity Intelligence', reason: 'scheduled_research_materialization', continuationMode: 'without_research', scanWeb: false })
    return NextResponse.json({ ok: true, research: result, opportunityMaterialization })
  } catch (error) {
    await recordProductionIncident({sourceType:'cron',sourceId:'research-control',incidentType:'scheduled_scan_failure',severity:'high',summary:'Échec du cron Research Control',detail:error instanceof Error?error.message:String(error),nextAction:'Retry ou pause gouvernée',sourceHref:'/market-os/content-command-center/production-operations'})
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'RESEARCH_CRON_FAILED' }, { status: 500 })
  }
}

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
