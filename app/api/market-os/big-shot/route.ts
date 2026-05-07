import { NextRequest, NextResponse } from 'next/server'
import { marketOSBigShotItems, marketOSBigShotScenarios, simulateExecution, type MarketOSBigShotMode } from '@/lib/market-os/big-shot-layer'

export async function GET() {
  return NextResponse.json({ ok: true, items: marketOSBigShotItems, scenarios: marketOSBigShotScenarios })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { mode?: MarketOSBigShotMode; action?: string }
  return NextResponse.json(simulateExecution(body.mode || 'campaign-execution', body.action || 'execute'))
}
