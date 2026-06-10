import { NextResponse } from 'next/server'
import { buildCareLinkOpsDashboard } from '../../../../lib/carelink/ops-dashboard-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return NextResponse.json(buildCareLinkOpsDashboard(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: 'live-empty',
        error: error instanceof Error ? error.message : 'Unknown CareLink dashboard error',
        generatedAt: new Date(0).toISOString(),
        kpis: [],
        lanes: [],
        cities: [],
        zones: [],
        agents: [],
        coverage: [],
        incidents: [],
        reports: [],
        followUps: [],
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
