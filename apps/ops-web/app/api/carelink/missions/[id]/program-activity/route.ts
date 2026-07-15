import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { recordCareLinkAgentActivity, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createAlert, createDispatchMessage, createNotification, loadMissionProgramActivityLogs, saveMissionProgramActivityLog } from '@/lib/carelink/mobile-persistence'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

type Body = {
  activityId?: string
  activityLabel?: string
  status?: string
  notes?: string | null
  issueSeverity?: string | null
  line?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeStatus(value: unknown) {
  const status = clean(value, 'completed').toLowerCase().replaceAll(' ', '_')
  if (['started', 'in_progress', 'completed', 'done', 'issue', 'blocked', 'skipped', 'validated'].includes(status)) return status
  return 'completed'
}

function isIssueStatus(status: string) {
  return ['issue', 'blocked'].includes(status)
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const logs = await loadMissionProgramActivityLogs(missionId, session.caregiverId)
    return NextResponse.json({ ok: true, data: logs })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission program activity load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await request.json().catch(() => ({})) as Body
    const activityId = clean(body.activityId)
    const activityLabel = clean(body.activityLabel, 'Activité programme')
    const status = normalizeStatus(body.status)
    const issueSeverity = body.issueSeverity ? clean(body.issueSeverity, 'medium') : null

    if (!activityId) {
      return NextResponse.json({ ok: false, error: 'activityId is required', code: 'carelink_program_activity_id_required' }, { status: 400 })
    }

    const metadata = {
      source: 'carelink_mobile',
      line: body.line || null,
      ...(body.metadata || {}),
    }

    const log = await saveMissionProgramActivityLog({
      missionId,
      caregiverId: session.caregiverId,
      activityId,
      activityLabel,
      status,
      notes: body.notes || null,
      issueSeverity,
      metadata,
    })

    await recordMissionEvent({
      missionId,
      eventType: isIssueStatus(status) ? 'mobile_program_activity_issue' : 'mobile_program_activity_updated',
      content: `${activityLabel} · ${status}${body.notes ? ` · ${body.notes}` : ''}`,
      metadata: { activity_id: activityId, activity_label: activityLabel, status, caregiver_id: session.caregiverId, issue_severity: issueSeverity, ...metadata },
      source: 'carelink_mobile',
    })

    await recordCareLinkAgentActivity({
      caregiverId: session.caregiverId,
      missionId,
      activityType: 'program_activity_update',
      status,
      outcome: isIssueStatus(status) ? 'attention_required' : 'recorded',
      priority: isIssueStatus(status) ? 'high' : 'normal',
      metadata: { activity_id: activityId, activity_label: activityLabel, notes: body.notes || null, issue_severity: issueSeverity },
    })

    await recordCareLinkMissionTimelineAudit({
      missionId,
      caregiverId: session.caregiverId,
      actionType: 'program_activity_update',
      eventType: isIssueStatus(status) ? 'program_activity_issue' : 'program_activity_update',
      outcome: status,
      metadata: { activity_id: activityId, activity_label: activityLabel, notes: body.notes || null, issue_severity: issueSeverity },
    })

    if (isIssueStatus(status)) {
      await createAlert({
        caregiverId: session.caregiverId,
        missionId,
        type: 'program_activity_issue',
        title: 'Incident programme activité',
        body: `${activityLabel}${body.notes ? ` · ${body.notes}` : ''}`,
        priority: issueSeverity === 'critical' ? 'critical' : 'high',
        linkedEntityType: 'mission_program_activity',
        linkedEntityId: activityId,
        metadata: { activity_id: activityId, activity_label: activityLabel, status, issue_severity: issueSeverity },
      })
      await createDispatchMessage({
        missionId,
        caregiverId: session.caregiverId,
        threadKey: `mission:${missionId}`,
        senderType: 'agent',
        recipientType: 'liaison_operationnelle',
        subject: 'Alerte programme activité',
        body: `${activityLabel}${body.notes ? ` · ${body.notes}` : ''}`,
        priority: issueSeverity === 'critical' ? 'critical' : 'high',
        metadata: { activity_id: activityId, status, issue_severity: issueSeverity },
      })
    } else if (status === 'completed' || status === 'done') {
      await createNotification({
        caregiverId: session.caregiverId,
        missionId,
        type: 'program_activity_completed',
        title: 'Activité programme terminée',
        body: activityLabel,
        priority: 'normal',
        metadata: { activity_id: activityId, status },
      })
    }

    return NextResponse.json({ ok: true, data: log })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission program activity update failed')
  }
}
