import { NextResponse } from 'next/server'
import { runRevenueAutomationEngine } from '../../../../../lib/revenue-command-center/automationEngine'

export const dynamic = 'force-dynamic'

export async function POST() {
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