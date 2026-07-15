import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

async function getParams(context: { params: Promise<{ id: string }> | { id: string } }) {
  return await Promise.resolve(context.params as any)
}

function parseDbError(message: string) {
  const missing =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)
  if (missing?.[1]) return missing[1]
  const notNull = message.match(/null value in column "([^"]+)"/i)
  if (notNull?.[1]) return notNull[1]
  return ''
}

async function adaptiveInsert(supabase: any, table: string, payload: AnyRow) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { table, ok: true, data, error: '' }
    const column = parseDbError(error.message || String(error))
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, ok: false, data: null, error: error.message || String(error) }
  }
  return { table, ok: false, data: null, error: 'adaptive insert failed' }
}

async function adaptiveUpdate(supabase: any, table: string, id: string, payload: AnyRow) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { table, ok: true, data, error: '' }
    const column = parseDbError(error.message || String(error))
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, ok: false, data: null, error: error.message || String(error) }
  }
  return { table, ok: false, data: null, error: 'adaptive update failed' }
}

async function selectByOrg(supabase: any, table: string, organizationId: string, limit = 50) {
  const attempts = [
    () => supabase.from(table).select('*').eq('organization_id', organizationId).limit(limit),
    () => supabase.from(table).select('*').eq('partner_id', organizationId).limit(limit),
  ]
  for (const attempt of attempts) {
    const { data, error } = await attempt()
    if (!error) return Array.isArray(data) ? data : []
  }
  return []
}

async function logActivity(supabase: any, organizationId: string, action: string, metadata: AnyRow) {
  const payload = {
    organization_id: organizationId,
    event_type: `traininghub.partner_dossier.${action}`,
    title: metadata.title || action,
    status: 'recorded',
    metadata: { source: 'commercial_depth_route', ...metadata },
    created_at: new Date().toISOString(),
  }
  return adaptiveInsert(supabase, 'partner_activity_events', payload)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })
  const { id } = await getParams(context)

  const { data: org, error } = await supabase.from('core_organizations').select('id, metadata').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, data: org?.metadata?.commercialDepth || {} })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })
  const { id } = await getParams(context)
  const body = await request.json().catch(() => ({}))
  const form = body.form || {}
  const now = new Date().toISOString()

  const { data: org, error } = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
  if (!org) return NextResponse.json({ ok: false, message: 'Partenaire introuvable.' }, { status: 404 })

  const commercialDepth = {
    offers: Array.isArray(form.offers) ? form.offers : [],
    billingRules: Array.isArray(form.billingRules) ? form.billingRules : [],
    deliveryServices: Array.isArray(form.deliveryServices) ? form.deliveryServices : [],
    proofControls: Array.isArray(form.proofControls) ? form.proofControls : [],
    lastSyncedAt: now,
  }

  const orgUpdate = await adaptiveUpdate(supabase, 'core_organizations', id, {
    metadata: {
      ...(org.metadata || {}),
      commercialDepth,
      commercial: {
        ...(org.metadata?.commercial || {}),
        plan: form.plan,
        owner: form.owner,
        monthlyAmount: form.monthlyAmount,
      },
      billing: {
        ...(org.metadata?.billing || {}),
        billingModel: form.billingModel,
        accountType: form.accountType,
        paymentTerms: form.paymentTerms,
        invoicePolicy: form.invoicePolicy,
        renewalPolicy: form.renewalPolicy,
        currency: form.currency || 'MAD',
      },
    },
    updated_at: now,
  })

  const results: AnyRow[] = []
  const existingProposals = await selectByOrg(supabase, 'bill_proposals', id, 100)
  for (const offer of commercialDepth.offers) {
    if (!offer?.title || !['ready_to_send', 'sent', 'negotiation', 'accepted', 'ready_to_convert', 'active'].includes(offer.status)) continue
    const existing = existingProposals.find((proposal) => proposal.proposal_code === offer.code || proposal.metadata?.commercialDepthOfferId === offer.id)
    const payload = {
      organization_id: id,
      partner_id: id,
      title: offer.title,
      proposal_code: offer.code || offer.id,
      status: offer.status,
      stage: offer.status,
      category: offer.family || offer.category || 'traininghub',
      amount_total: Number(offer.setup || 0) + Number(offer.annual || 0),
      currency: form.currency || 'MAD',
      metadata: {
        commercialDepthOfferId: offer.id,
        source: 'commercial_depth_route',
        offer,
      },
      updated_at: now,
    }
    results.push(existing?.id ? await adaptiveUpdate(supabase, 'bill_proposals', existing.id, payload) : await adaptiveInsert(supabase, 'bill_proposals', { ...payload, created_at: now }))
  }

  const existingSessions = await selectByOrg(supabase, 'trn_sessions', id, 100)
  for (const service of commercialDepth.deliveryServices) {
    if (!service?.title || !['ready', 'planned', 'in_progress'].includes(service.status)) continue
    const existing = existingSessions.find((session) => session.session_code === service.code || session.metadata?.commercialDepthServiceId === service.id)
    const payload = {
      organization_id: id,
      partner_id: id,
      title: service.title,
      session_code: service.code || service.id,
      status: service.status === 'planned' ? 'planned' : 'draft',
      mode: service.mode || 'onsite',
      location: service.location || form.city || 'Site partenaire',
      starts_at: service.startsAt || null,
      capacity: Number(service.capacity || 0),
      metadata: {
        commercialDepthServiceId: service.id,
        source: 'commercial_depth_route',
        service,
      },
      updated_at: now,
    }
    results.push(existing?.id ? await adaptiveUpdate(supabase, 'trn_sessions', existing.id, payload) : await adaptiveInsert(supabase, 'trn_sessions', { ...payload, created_at: now }))
  }

  for (const rule of commercialDepth.billingRules) {
    if (rule.status === 'active') {
      await logActivity(supabase, id, 'billing_rule_active', { title: rule.name, rule })
    }
  }
  for (const proof of commercialDepth.proofControls) {
    if (proof.status === 'required') {
      await logActivity(supabase, id, 'proof_control_required', { title: proof.title, proof })
    }
  }

  await logActivity(supabase, id, 'commercial_depth_synced', {
    title: 'Commercial depth synchronized',
    offers: commercialDepth.offers.length,
    billingRules: commercialDepth.billingRules.length,
    deliveryServices: commercialDepth.deliveryServices.length,
    proofControls: commercialDepth.proofControls.length,
    results,
  })

  return NextResponse.json({
    ok: orgUpdate.ok,
    data: { commercialDepth, results },
    message: orgUpdate.ok ? 'Commercial depth synchronisé.' : orgUpdate.error,
  })
}

