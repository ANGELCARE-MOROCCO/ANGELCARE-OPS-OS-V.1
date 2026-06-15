import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const payload = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, ...payload }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: 'error',
        generatedAt: new Date(0).toISOString(),
        error: error instanceof Error ? error.message : 'Unknown CareLink dashboard error',
        records: [],
        todayMissions: [],
        upcomingMissions: [],
        activeMission: null,
        nextMission: null,
        readiness: { score: 0, status: 'pending', blockers: [], warnings: [], nextAction: 'Centre indisponible' },
        stats: { todayMissions: 0, weekHours: 0, reliabilityScore: 0, performanceScore: 0, noShowCount: 0, cancellationCount: 0, completedCount: 0, pendingReports: 0, unreadMessages: 0, criticalAlerts: 0 },
        payments: { currency: 'MAD', earned: 0, pendingValidation: 0, paid: 0, bonuses: 0, transport: 0, allowances: 0, upcomingPayment: 0, lines: [] },
        alerts: [],
        notifications: [],
        messages: [],
        history: [],
        support: [],
        schedule: [],
        calendar: { byDate: [], density: 0 },
        workspaces: { safety: [] },
        dispatchThreads: [],
        checklistItems: [],
        reports: [],
        paymentDisputes: [],
        documents: [],
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
