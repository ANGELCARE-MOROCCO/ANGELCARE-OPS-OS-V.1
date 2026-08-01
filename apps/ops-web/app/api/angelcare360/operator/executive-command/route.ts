import { NextResponse } from 'next/server'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'
import { getExecutiveCommandSnapshot } from '@/lib/angelcare360/operator/executive-command'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import type { ExecutiveEntityType } from '@/types/angelcare360/operator/executive-command'

export const dynamic = 'force-dynamic'

type Payload = Record<string, unknown>

type EntityConfig = {
  table: string
  createFields: string[]
  updateFields: string[]
}

const ENTITY_CONFIG: Record<ExecutiveEntityType, EntityConfig> = {
  priority: {
    table: 'angelcare360_operator_executive_priorities',
    createFields: ['title', 'summary', 'status', 'priority', 'authority_level', 'owner_name', 'sponsor_name', 'due_at', 'impact', 'evidence_state', 'source_type', 'source_id', 'next_action', 'href', 'metadata'],
    updateFields: ['title', 'summary', 'status', 'priority', 'authority_level', 'owner_name', 'sponsor_name', 'due_at', 'impact', 'evidence_state', 'source_type', 'source_id', 'next_action', 'href', 'metadata'],
  },
  decision: {
    table: 'angelcare360_operator_executive_decisions',
    createFields: ['title', 'statement', 'decision_type', 'status', 'authority_level', 'owner_name', 'sponsor_name', 'due_at', 'financial_impact_mad', 'customer_impact', 'risk_level', 'evidence_state', 'conditions', 'rationale', 'outcome', 'metadata'],
    updateFields: ['title', 'statement', 'decision_type', 'status', 'authority_level', 'owner_name', 'sponsor_name', 'due_at', 'financial_impact_mad', 'customer_impact', 'risk_level', 'evidence_state', 'conditions', 'rationale', 'outcome', 'metadata'],
  },
  agenda: {
    table: 'angelcare360_operator_executive_agenda_streams',
    createFields: ['title', 'strategic_pillar', 'horizon', 'status', 'executive_sponsor', 'owner_name', 'objective', 'progress', 'confidence', 'due_at', 'dependencies', 'pressure', 'expected_outcome', 'metadata'],
    updateFields: ['title', 'strategic_pillar', 'horizon', 'status', 'executive_sponsor', 'owner_name', 'objective', 'progress', 'confidence', 'due_at', 'dependencies', 'pressure', 'expected_outcome', 'metadata'],
  },
  objective: {
    table: 'angelcare360_operator_executive_objectives',
    createFields: ['title', 'domain', 'status', 'owner_name', 'target_value', 'actual_value', 'unit', 'confidence', 'trend', 'due_at', 'evidence_state', 'corrective_action', 'metadata'],
    updateFields: ['title', 'domain', 'status', 'owner_name', 'target_value', 'actual_value', 'unit', 'confidence', 'trend', 'due_at', 'evidence_state', 'corrective_action', 'metadata'],
  },
  initiative: {
    table: 'angelcare360_operator_executive_initiatives',
    createFields: ['title', 'program_type', 'status', 'sponsor_name', 'owner_name', 'progress', 'confidence', 'expected_value', 'current_milestone', 'next_milestone', 'due_at', 'dependencies', 'blockers', 'metadata'],
    updateFields: ['title', 'program_type', 'status', 'sponsor_name', 'owner_name', 'progress', 'confidence', 'expected_value', 'current_milestone', 'next_milestone', 'due_at', 'dependencies', 'blockers', 'metadata'],
  },
  risk: {
    table: 'angelcare360_operator_executive_risks',
    createFields: ['title', 'domain', 'status', 'likelihood', 'impact', 'exposure', 'owner_name', 'sponsor_name', 'early_signals', 'plan_a', 'plan_b', 'plan_c', 'escalation_threshold', 'current_response', 'next_review_at', 'metadata'],
    updateFields: ['title', 'domain', 'status', 'likelihood', 'impact', 'exposure', 'owner_name', 'sponsor_name', 'early_signals', 'plan_a', 'plan_b', 'plan_c', 'escalation_threshold', 'current_response', 'next_review_at', 'metadata'],
  },
  board_session: {
    table: 'angelcare360_operator_executive_board_sessions',
    createFields: ['title', 'session_type', 'status', 'scheduled_at', 'chair_name', 'secretary_name', 'agenda_count', 'resolution_count', 'open_commitments', 'evidence_state', 'agenda', 'participants', 'metadata'],
    updateFields: ['title', 'session_type', 'status', 'scheduled_at', 'chair_name', 'secretary_name', 'agenda_count', 'resolution_count', 'open_commitments', 'evidence_state', 'agenda', 'participants', 'metadata'],
  },
  paper: {
    table: 'angelcare360_operator_executive_papers',
    createFields: ['title', 'paper_type', 'status', 'audience', 'owner_name', 'approval_state', 'due_at', 'version_number', 'confidentiality', 'content', 'metadata'],
    updateFields: ['title', 'paper_type', 'status', 'audience', 'owner_name', 'approval_state', 'due_at', 'version_number', 'confidentiality', 'content', 'metadata'],
  },
  mandate: {
    table: 'angelcare360_operator_executive_mandates',
    createFields: ['title', 'status', 'owner_name', 'sponsor_name', 'due_at', 'progress', 'expected_outcome', 'outcome_state', 'source_type', 'source_id', 'metadata'],
    updateFields: ['title', 'status', 'owner_name', 'sponsor_name', 'due_at', 'progress', 'expected_outcome', 'outcome_state', 'source_type', 'source_id', 'metadata'],
  },
}

function cleanPayload(payload: Payload, allowed: string[]) {
  const output: Payload = {}
  for (const key of allowed) {
    if (payload[key] !== undefined) output[key] = payload[key]
  }
  return output
}

function entityType(value: unknown): ExecutiveEntityType {
  const normalized = String(value || '') as ExecutiveEntityType
  if (!ENTITY_CONFIG[normalized]) throw new Error('Type d’objet exécutif invalide.')
  return normalized
}

async function auditEvent(input: {
  entityType: ExecutiveEntityType
  entityId?: string | null
  eventType: string
  actorId: string
  summary: string
  previousState?: unknown
  nextState?: unknown
  metadata?: Payload
}) {
  const supabase = createEmailOSCoreDb()
  await supabase.from('angelcare360_operator_executive_events').insert({
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    event_type: input.eventType,
    actor_user_id: input.actorId,
    summary: input.summary,
    previous_state: input.previousState || null,
    next_state: input.nextState || null,
    metadata: input.metadata || {},
  })
}

export async function GET() {
  try {
    const snapshot = await getExecutiveCommandSnapshot()
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Executive Command indisponible.' }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAngelcare360OperatorPermission('operator.settings.update')
    const body = await request.json().catch(() => ({})) as Payload
    const operation = String(body.operation || '')
    const payload = body.payload && typeof body.payload === 'object' ? body.payload as Payload : {}
    const type = entityType(payload.entityType)
    const config = ENTITY_CONFIG[type]
    const supabase = createEmailOSCoreDb()

    if (operation === 'entity.create') {
      const values = cleanPayload(payload, config.createFields)
      values.created_by = session.user.id
      values.updated_by = session.user.id
      const { data, error } = await supabase.from(config.table).insert(values).select('*').single()
      if (error) throw error
      await auditEvent({ entityType: type, entityId: String(data.id), eventType: 'created', actorId: session.user.id, summary: `${type} créé depuis Executive Command.`, nextState: data })
      return NextResponse.json({ ok: true, data })
    }

    if (operation === 'entity.update') {
      const id = String(payload.id || '')
      if (!id) throw new Error('Identifiant requis.')
      const { data: previous } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
      const values = cleanPayload(payload, config.updateFields)
      values.updated_by = session.user.id
      const { data, error } = await supabase.from(config.table).update(values).eq('id', id).select('*').single()
      if (error) throw error
      await auditEvent({ entityType: type, entityId: id, eventType: 'updated', actorId: session.user.id, summary: `${type} mis à jour depuis Executive Command.`, previousState: previous, nextState: data })
      return NextResponse.json({ ok: true, data })
    }

    if (operation === 'entity.transition') {
      const id = String(payload.id || '')
      const status = String(payload.status || '')
      if (!id || !status) throw new Error('Identifiant et statut requis.')
      const { data: previous } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
      const update: Payload = { status, updated_by: session.user.id }
      if (type === 'decision' && status === 'approved') {
        update.approved_by = session.user.id
        update.approved_at = new Date().toISOString()
      }
      if (type === 'paper' && status === 'approved') {
        update.approved_by = session.user.id
        update.approved_at = new Date().toISOString()
        update.approval_state = 'approved'
      }
      const { data, error } = await supabase.from(config.table).update(update).eq('id', id).select('*').single()
      if (error) throw error
      await auditEvent({ entityType: type, entityId: id, eventType: `transition.${status}`, actorId: session.user.id, summary: `${type} déplacé vers ${status}.`, previousState: previous, nextState: data })
      return NextResponse.json({ ok: true, data })
    }

    if (operation === 'entity.archive') {
      const id = String(payload.id || '')
      if (!id) throw new Error('Identifiant requis.')
      const { data: previous } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
      const { data, error } = await supabase.from(config.table).update({ status: 'archived', archived_at: new Date().toISOString(), updated_by: session.user.id }).eq('id', id).select('*').single()
      if (error) throw error
      await auditEvent({ entityType: type, entityId: id, eventType: 'archived', actorId: session.user.id, summary: `${type} archivé.`, previousState: previous, nextState: data })
      return NextResponse.json({ ok: true, data })
    }

    if (operation === 'decision.mandate') {
      if (type !== 'decision') throw new Error('Cette opération exige une décision.')
      const id = String(payload.id || '')
      if (!id) throw new Error('Identifiant de décision requis.')
      const { data: decision, error: decisionError } = await supabase.from(config.table).select('*').eq('id', id).single()
      if (decisionError) throw decisionError
      const { data: mandate, error } = await supabase.from('angelcare360_operator_executive_mandates').insert({
        title: String(payload.title || decision.title),
        status: 'mandated',
        owner_name: String(payload.owner_name || decision.owner_name || 'À assigner'),
        sponsor_name: String(payload.sponsor_name || decision.sponsor_name || 'Direction Générale'),
        due_at: payload.due_at || decision.due_at || null,
        progress: 0,
        expected_outcome: String(payload.expected_outcome || decision.statement || ''),
        source_type: 'decision',
        source_id: id,
        created_by: session.user.id,
        updated_by: session.user.id,
      }).select('*').single()
      if (error) throw error
      await supabase.from(config.table).update({ status: 'mandated', updated_by: session.user.id }).eq('id', id)
      await auditEvent({ entityType: 'decision', entityId: id, eventType: 'mandate.created', actorId: session.user.id, summary: 'Mandat exécutif créé depuis la décision.', metadata: { mandateId: mandate.id } })
      return NextResponse.json({ ok: true, data: mandate })
    }

    return NextResponse.json({ error: 'Opération Executive Command inconnue.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action Executive Command refusée.' }, { status: 400 })
  }
}
