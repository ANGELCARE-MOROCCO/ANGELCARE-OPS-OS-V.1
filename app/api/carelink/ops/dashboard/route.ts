import { NextResponse } from 'next/server'
import { buildCareLinkOpsDashboard } from '@/lib/carelink/ops-dashboard-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const payload = buildCareLinkOpsDashboard()

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: 'live-empty',
        error: error instanceof Error ? error.message : 'Unknown CareLink Ops dashboard error',
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
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}
