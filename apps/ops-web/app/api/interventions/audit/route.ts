import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'

export async function GET() {
  return NextResponse.json({ ok: true, live: true, records: INTERVENTION_SEED_STATE.audits })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    ok: true,
    live: true,
    audit: {
      id: `audit-${Date.now()}`,
      at: new Date().toISOString(),
      actor: body.actor || 'AngelCare Production Operator',
      role: body.role || 'Ops',
      entityType: body.entityType || 'intervention',
      entityId: body.entityId || 'manual',
      event: body.event || 'phase4 audit event',
      summary: body.summary || 'Évènement audit Phase 4 enregistré.',
      riskLevel: body.riskLevel || 'Modéré',
    },
  })
}
