import { NextResponse } from 'next/server'
import { getMarketingAiConfig } from '@/lib/market-os/marketing-ai/config'
import { runMarketingAutopilotCycle } from '@/lib/market-os/marketing-ai/autopilot'

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
    const result = await runMarketingAutopilotCycle({
      workerId,
      actor: { id: 'system-cron', name: 'SANILA Marketing Operations Autopilot' },
      processSchedules: true,
      processJobs: true,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AUTOPILOT_CYCLE_FAILED' }, { status: 500 })
  }
}

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
