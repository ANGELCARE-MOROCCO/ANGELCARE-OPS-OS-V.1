import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { runRevenueAutomationEngine } from '../../../../../lib/revenue-command-center/automationEngine'

export const dynamic = 'force-dynamic'

async function POST__angelcareGovernedImpl() {
  try {
    const result = await runRevenueAutomationEngine()
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Automation engine failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await runRevenueAutomationEngine()
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Automation engine failed' },
      { status: 500 }
    )
  }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/revenue-command-center/automation/run',
  },
  POST__angelcareGovernedImpl,
)
