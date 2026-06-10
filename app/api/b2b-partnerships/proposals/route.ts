import { NextRequest, NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BActivity, logB2BAuditEvent } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { PROPOSAL_STATUSES } from '@/lib/b2b-partnerships/completion-types'

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : []
}

function money(value: unknown) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function validateProposalPayload(body: Record<string, unknown>) {
  const prospect_id = optionalString(body.prospect_id)
  const proposal_title = optionalString(body.proposal_title)
  const status = optionalString(body.status) ?? 'Draft'

  if (!prospect_id) return { ok: false as const, error: 'Prospect is required.' }
  if (!proposal_title) return { ok: false as const, error: 'Proposal title is required.' }
  if (!PROPOSAL_STATUSES.includes(status as any)) return { ok: false as const, error: 'Invalid proposal status.' }

  return {
    ok: true as const,
    value: {
      prospect_id,
      proposal_title,
      proposal_type: optionalString(body.proposal_type),
      services_included: list(body.services_included),
      pricing_model: optionalString(body.pricing_model),
      estimated_monthly_value: money(body.estimated_monthly_value),
      estimated_annual_value: money(body.estimated_annual_value),
      pilot_duration: optionalString(body.pilot_duration),
      status,
      follow_up_at: optionalString(body.follow_up_at),
    },
  }
}

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const { data, error } = await db
      .from('b2b_proposals')
      .select('*, prospect:b2b_prospects(id,name,sector,city,status,priority_score,relationship_warmth,estimated_monthly_value,estimated_annual_value,decision_maker_name,decision_maker_email,decision_maker_phone)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ ok: false, error: 'Unable to load proposals.' }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('create', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const body = await req.json()
    const validated = validateProposalPayload(body)
    if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })

    const { data, error } = await db
      .from('b2b_proposals')
      .insert({ ...validated.value, created_by: actor.id })
      .select('*')
      .single()

    if (error) return NextResponse.json({ ok: false, error: 'Unable to create proposal.' }, { status: 500 })

    await logB2BActivity({
      db,
      prospectId: data.prospect_id,
      actorId: actor.id,
      activityType: 'proposal.created',
      title: 'B2B proposal created',
      description: data.proposal_title,
      metadata: { status: data.status, value: data.estimated_annual_value },
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_proposal',
      entityId: data.id,
      action: B2B_AUDIT_ACTIONS.PROPOSAL_CREATED,
      afterData: data,
    })

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
