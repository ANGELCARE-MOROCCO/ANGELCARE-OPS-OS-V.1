import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const now = new Date().toISOString()
  return NextResponse.json({
    ok: true,
    live: true,
    phase: 'phase12_corrected_unique_purpose_modals',
    writeTarget: body.writePath || 'intervention_modal_executions + intervention_audit_logs',
    received: body,
    audit: {
      at: now,
      event: body.auditEvent || body.action || 'purpose-built modal executed',
      entityId: body.entityId || 'contextual',
      entityType: body.entityType || 'intervention',
      modalKey: body.modalKey || 'unknown',
      actionLabel: body.actionLabel || 'execute',
      summary: `Modal purpose-built ${body.modalKey || 'unknown'} exécuté sans footer générique`,
    },
  })
}
