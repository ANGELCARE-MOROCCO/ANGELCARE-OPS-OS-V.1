import { NextResponse } from 'next/server'
import { getMarketingAiConfig } from '@/lib/market-os/marketing-ai/config'
import { runMarketingAutopilotCycle } from '@/lib/market-os/marketing-ai/autopilot'
import { assertProductionCapability, recordProductionIncident } from '@/lib/market-os/content-command-headquarters/production-operations-service'

function authorized(request: Request) {
  const config = getMarketingAiConfig()
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || request.headers.get('x-marketing-ai-cron-secret')
    || ''
  return Boolean(config.cronSecret && token === config.cronSecret)
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'CRON_UNAUTHORIZED' }, { status: 401 })
  const workerId = `vercel-cron:${new Date().toISOString()}`
  try {
    const policy = await assertProductionCapability('ai')
    if (!policy.allowed) return NextResponse.json({ ok: true, skipped: true, reason: policy.reason, manualContinuity: true })
    const result = await runMarketingAutopilotCycle({
      workerId,
      actor: { id: 'system-cron', name: 'SANILA Marketing Operations Autopilot' },
      processSchedules: true,
      processJobs: true,
    })
    return NextResponse.json(result)
  } catch (error) {
    await recordProductionIncident({sourceType:'cron',sourceId:'marketing-ai',incidentType:'autopilot_cycle_failure',severity:'high',summary:'Échec du cycle Marketing AI',detail:error instanceof Error?error.message:String(error),nextAction:'Retry, pause ou continuité manuelle',sourceHref:'/market-os/content-command-center/production-operations'})
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AUTOPILOT_CYCLE_FAILED' }, { status: 500 })
  }
}

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
