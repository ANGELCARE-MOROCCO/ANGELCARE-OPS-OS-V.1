import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ entity: string }> | { entity: string } }
type AnyRecord = Record<string, any>

const TABLES: Record<string, string> = {
  investors: 'capital_investors',
  opportunities: 'capital_opportunities',
  commitments: 'capital_commitments',
  payments: 'capital_payments',
  diligence: 'capital_diligence_tasks',
  documents: 'capital_documents',
  notes: 'capital_notes',
  trainings: 'capital_training_pages',
}

function safeData(body: AnyRecord) {
  const current = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}
  const reserved = new Set(['id','reference_number','created_at','updated_at','archived'])
  const extras: AnyRecord = {}
  for (const [key, value] of Object.entries(body)) {
    if (!reserved.has(key) && key.startsWith('data_')) extras[key.replace(/^data_/, '')] = value
  }
  return { ...current, ...extras }
}

function money(value: any) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function clean(entity: string, body: AnyRecord) {
  const now = new Date().toISOString()
  const p: AnyRecord = { updated_at: now }

  if (entity === 'investors') {
    Object.assign(p, {
      investor_name: body.investor_name || body.name || 'New Investor',
      investor_type: body.investor_type || 'individual',
      stage: body.stage || 'prospect',
      priority: body.priority || 'normal',
      country: body.country || null,
      city: body.city || null,
      contact_name: body.contact_name || null,
      email: body.email || null,
      phone: body.phone || null,
      relationship_owner: body.relationship_owner || null,
      investor_profile: body.investor_profile || null,
      ticket_size_min: money(body.ticket_size_min),
      ticket_size_max: money(body.ticket_size_max),
      currency: body.currency || 'Dhs',
      next_followup_at: body.next_followup_at || null,
      compliance_status: body.compliance_status || 'pending',
    })
  }

  if (entity === 'opportunities') {
    Object.assign(p, {
      opportunity_title: body.opportunity_title || body.title || 'New Opportunity',
      opportunity_type: body.opportunity_type || 'fundraise',
      stage: body.stage || 'screening',
      status: body.status || 'active',
      target_amount: money(body.target_amount),
      committed_amount: money(body.committed_amount),
      received_amount: money(body.received_amount),
      valuation: money(body.valuation),
      currency: body.currency || 'Dhs',
      sector: body.sector || null,
      geography: body.geography || null,
      owner: body.owner || null,
      probability: Number(body.probability || 0),
      closing_date: body.closing_date || null,
      thesis: body.thesis || null,
      risk_summary: body.risk_summary || null,
    })
  }

  if (entity === 'commitments') {
    Object.assign(p, {
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      commitment_type: body.commitment_type || 'soft_commitment',
      status: body.status || 'soft_commit',
      committed_amount: money(body.committed_amount),
      received_amount: money(body.received_amount),
      currency: body.currency || 'Dhs',
      commitment_date: body.commitment_date || null,
      expected_close_date: body.expected_close_date || null,
      documents_status: body.documents_status || 'pending',
      conditions: body.conditions || null,
    })
  }

  if (entity === 'payments') {
    Object.assign(p, {
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      commitment_id: body.commitment_id ? Number(body.commitment_id) : null,
      payment_type: body.payment_type || 'capital_receipt',
      status: body.status || 'pending',
      amount: money(body.amount),
      currency: body.currency || 'Dhs',
      due_date: body.due_date || null,
      paid_date: body.paid_date || null,
      payment_method: body.payment_method || null,
      payment_details: body.payment_details || null,
      proof_url: body.proof_url || null,
      finance_note: body.finance_note || null,
    })
  }

  if (entity === 'diligence') {
    Object.assign(p, {
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      task_title: body.task_title || body.title || 'Due diligence task',
      category: body.category || 'finance',
      status: body.status || 'open',
      priority: body.priority || 'normal',
      owner: body.owner || null,
      due_date: body.due_date || null,
      completed_at: body.status === 'completed' ? (body.completed_at || now) : null,
      evidence_url: body.evidence_url || null,
      notes: body.notes || null,
    })
  }

  if (entity === 'trainings') {
    Object.assign(p, {
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      training_title: body.training_title || body.title || 'Fundraising staff training page',
      training_source: body.training_source || 'AngelCare fundraising academy',
      category: body.category || 'fundraising_staff',
      status: body.status || body.publish_status || 'draft',
      priority: body.priority || 'normal',
      owner: body.owner || null,
      audience: body.audience || 'Fundraising staff',
      publish_status: body.publish_status || body.status || 'draft',
      html_content: body.html_content || '',
      summary: body.summary || null,
      duration_minutes: Number(body.duration_minutes || 360),
    })
  }

  if (entity === 'documents') {
    Object.assign(p, {
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      commitment_id: body.commitment_id ? Number(body.commitment_id) : null,
      document_title: body.document_title || body.title || 'Capital document',
      category: body.category || 'data_room',
      status: body.status || 'draft',
      visibility: body.visibility || 'internal',
      file_url: body.file_url || null,
      version: body.version || 'v1',
      owner: body.owner || null,
      expiry_date: body.expiry_date || null,
    })
  }

  if (entity === 'notes') {
    Object.assign(p, {
      investor_id: body.investor_id ? Number(body.investor_id) : null,
      opportunity_id: body.opportunity_id ? Number(body.opportunity_id) : null,
      commitment_id: body.commitment_id ? Number(body.commitment_id) : null,
      category: body.category || 'general',
      priority: body.priority || 'normal',
      note: body.note || 'Internal note',
      owner: body.owner || null,
      followup_at: body.followup_at || null,
    })
  }

  if (body.data !== undefined || Object.keys(safeData(body)).length > 0) {
    p.data = safeData(body)
  }

  return p
}

export async function POST(request: NextRequest, context: Ctx) {
  try {
    const { entity } = await context.params
    const table = TABLES[entity]
    if (!table) return NextResponse.json({ ok: false, error: 'Unsupported entity' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).insert(clean(entity, body)).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to create record' }, { status: 500 })
  }
}
